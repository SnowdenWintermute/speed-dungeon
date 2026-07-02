import { FetchAbortedError } from "../../../errors/fetch-aborted.js";
import { invariant } from "../../../utils/index.js";
import { AssetFetchProgressTracker } from "./asset-fetch-progress-tracker.js";
import { ManagedAssetFetch } from "./managed-asset-fetch.js";
import { AssetFetchPriority, ScheduledFetchQueue } from "./scheduled-fetch-queue.js";
import { AssetCache, RemoteAssetStore } from "./stores/index.js";
import { AssetManifest, AssetVersionData, VersionedAsset } from "./versioned-asset.js";
import cloneDeep from "lodash.clonedeep";

export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

const TARGET_CONCURRENT_FETCH_COUNT = 2;

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

export type FetchCompletionCallback = (assetId: AssetId) => void;

export class ClientAppAssetService implements AssetService {
  private prefetchQueue = new ScheduledFetchQueue();
  private activeFetches = new Map<AssetId, ManagedAssetFetch>();
  private _assetManifest: null | AssetManifest = null;
  public readonly progressTracker = new AssetFetchProgressTracker();
  // track completion of full update
  private updateCompletionResolver?: () => void;
  private updateCompletionPromise?: Promise<void>;

  constructor(
    private readonly remoteStore: RemoteAssetStore,
    private readonly cache: AssetCache,
    private readonly assetIdsByDefaultPrefetchPriority: Map<AssetId, AssetFetchPriority>,
    private readonly isOnline: () => boolean,
    private readonly onFetchErrorCallback: (error: Error) => void
  ) {}

  get assetManifest() {
    return cloneDeep(this._assetManifest);
  }

  dispose() {
    this.cache.dispose();
  }

  async initialize(options?: { clearCache?: boolean }) {
    if (this._assetManifest !== null) {
      console.info(`asset service initialized already`);
      return this.assetManifest;
    }
    // invariant(this.assetManifest === null, `asset service initialized already`);

    if (options?.clearCache) {
      console.log("clearin cache");

      await this.cache.clear();
    }

    const offline = !this.isOnline();
    if (offline) {
      // check if have a lastCachedManifest
      // check if cache containes all assets
      // check if manifest version matches game version
    }

    try {
      const upToDateVersionData = await this.getFreshAssetIdVersions();
      this._assetManifest = upToDateVersionData;

      const prefetchQueue = await this.scheduleAssetUpdates();
      this.progressTracker.initialize(this._assetManifest, prefetchQueue);
      this.startAssetUpdatesPrefetch();

      return cloneDeep(upToDateVersionData);
    } catch (error) {
      console.info("error fetching asset manifest:", error);
      this.progressTracker.fetchFailed = true;
      if (error instanceof Error) {
        this.onFetchErrorCallback(error);
      } else {
        this.onFetchErrorCallback(
          new Error("Fetching asset manifest failed with unknown error type")
        );
      }
    }
  }

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const currentFetchOption = this.activeFetches.get(assetId);
    const isBeingFetched = currentFetchOption !== undefined;

    if (isBeingFetched) {
      currentFetchOption.priority = AssetFetchPriority.Urgent; // otherwise we might abort this by accident
      const assetBytes = await currentFetchOption.promise;
      return assetBytes;
    }

    const scheduledFetchOption = this.prefetchQueue.remove(assetId);
    if (scheduledFetchOption !== undefined) {
      const bytesOptionIfNotAborted = await this.startManagedFetch(
        assetId,
        AssetFetchPriority.Urgent
      );
      if (bytesOptionIfNotAborted) {
        return bytesOptionIfNotAborted;
      } else {
        throw new Error("Did not expect to abort an urgent priority fetch");
      }
    }

    const assetInCacheOption = await this.cache.getAssetOption(assetId);
    invariant(assetInCacheOption !== undefined, "Asset was neither cached nor scheduled for fetch");

    return assetInCacheOption.bytes;
  }

  private async startManagedFetch(assetId: AssetId, priority: AssetFetchPriority) {
    const tooManyConcurrentFetches = this.activeFetches.size > TARGET_CONCURRENT_FETCH_COUNT;
    if (tooManyConcurrentFetches) {
      this.rescheduleLowPriorityFetches();
    }

    this.progressTracker.onFetchStart(assetId);
    const { promise, abort } = this.remoteStore.getAssetBytesAbortable(assetId);

    const versionData = this.requireAssetManifestEntry(assetId);

    const newFetch = new ManagedAssetFetch(promise, versionData, priority, abort);

    const managedFetchPromise = promise
      .then(async (bytes) => {
        const versionedAsset = new VersionedAsset(bytes, versionData);

        await this.cache.cacheAsset(assetId, versionedAsset);
        this.progressTracker.onFetchComplete(assetId);
        return bytes;
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return;
        }
        throw error;
      })
      .finally(() => {
        this.activeFetches.delete(assetId);
        const updatesCompleted = this.activeFetches.size === 0 && this.prefetchQueue.isEmpty();

        if (updatesCompleted) {
          this.clearUnusedFromCache();
          this.markUpdateAsCompleted();
        }

        if (this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT) {
          this.startNextPrefetch();
        }
      });

    this.activeFetches.set(assetId, newFetch);

    const result = await managedFetchPromise;
    return result;
  }

  private markUpdateAsInProgress() {
    if (!this.updateCompletionPromise) {
      this.updateCompletionPromise = new Promise<void>((resolve) => {
        this.updateCompletionResolver = resolve;
      });
    }
  }

  private markUpdateAsCompleted() {
    if (this.updateCompletionResolver !== undefined) {
      this.updateCompletionResolver();
      this.updateCompletionResolver = undefined;
      this.updateCompletionPromise = undefined;
    }
  }

  /** abort any non-urgent fetches and add them back into pre-fetch list to get later */
  private rescheduleLowPriorityFetches() {
    const nonUrgentFetchIds = Array.from(this.activeFetches.entries())
      .filter(([assetId, managedFetch]) => managedFetch.isPreemptable())
      .map(([assetId, managedFetch]) => assetId);

    for (const managedFetchId of nonUrgentFetchIds) {
      const managedFetch = this.activeFetches.get(managedFetchId);
      invariant(managedFetch !== undefined);
      managedFetch.abort();
      this.progressTracker.onFetchAbort(managedFetchId);
      this.activeFetches.delete(managedFetchId);

      this.prefetchQueue.add(managedFetchId, managedFetch.priority);
    }
  }

  private async startNextPrefetch() {
    const nextHighestPriorityFetch = this.prefetchQueue.popNextHighestPriority();
    if (nextHighestPriorityFetch === undefined) {
      return;
    }

    const { id, priority } = nextHighestPriorityFetch;

    this.startManagedFetch(id, priority);
  }

  async scheduleAssetUpdates() {
    const needsUpdate = await this.getAssetIdsNeedingUpdate();

    for (const [assetId, versionData] of needsUpdate) {
      let defaultPriority = this.assetIdsByDefaultPrefetchPriority.get(assetId);
      if (defaultPriority === undefined) {
        defaultPriority = AssetFetchPriority.PrefetchLow;
      }

      this.prefetchQueue.add(assetId, defaultPriority);
    }

    return needsUpdate;
  }

  async startAssetUpdatesPrefetch() {
    console.info("starting asset prefetch");
    this.markUpdateAsInProgress();

    while (
      this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT &&
      this.prefetchQueue.hasEntries()
    ) {
      console.log("started prefetch");
      this.startNextPrefetch();
    }
  }

  private async getAssetIdsNeedingUpdate() {
    const updatedAssetList = this.requireAssetManifest();

    const needsUpdate = new Map<AssetId, AssetVersionData>();
    const comparePromises: Promise<void>[] = [];

    for (const [assetId, versionData] of Object.entries(updatedAssetList)) {
      const typedAssetId = assetId as AssetId;
      const checkIfMissingOrStale = new Promise<void>((resolve, reject) => {
        this.cache
          .getAssetOption(typedAssetId)
          .then((assetOption) => {
            const notCached = assetOption === undefined;
            if (notCached) {
              needsUpdate.set(typedAssetId, versionData);
              resolve();
              return;
            }

            const cachedAssetIsStale = assetOption.versionData.hash !== versionData.hash;

            if (cachedAssetIsStale) {
              needsUpdate.set(typedAssetId, versionData);
            }

            resolve();
          })
          .catch((error) => console.error(error));
      }).catch((error) => console.error(error));
      comparePromises.push(checkIfMissingOrStale);
    }

    await Promise.all(comparePromises);

    return needsUpdate;
  }

  private async getFreshAssetIdVersions(): Promise<AssetManifest> {
    return await this.remoteStore.getAssetManifest();
  }

  private requireAssetManifest(): AssetManifest {
    invariant(
      this.assetManifest !== null,
      "ClientAppAssetService was not initialized with updated asset list"
    );

    return this.assetManifest;
  }

  private requireAssetManifestEntry(assetId: AssetId) {
    const assetManifest = this.requireAssetManifest();
    const result = assetManifest[assetId];
    if (result === undefined) {
      throw new Error("Expected to have this asset in the version manifest");
    }
    return result;
  }

  private async clearUnusedFromCache() {
    const updatedAssetList = this.requireAssetManifest();
    await this.cache.removeAssetsNotIncluded(
      new Set(Object.keys(updatedAssetList).map((key) => key as AssetId))
    );
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof FetchAbortedError;
}

import { FetchAbortedError } from "../../../errors/fetch-aborted.js";
import { invariant } from "../../../utils/index.js";
import { ManagedAssetFetch } from "./managed-asset-fetch.js";
import { AssetFetchPriority, ScheduledFetchQueue } from "./scheduled-fetch-queue.js";
import { AssetCache, RemoteAssetStore } from "./stores/index.js";
import { AssetManifest, AssetVersionData, VersionedAsset } from "./versioned-asset.js";

export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

const TARGET_CONCURRENT_FETCH_COUNT = 2;

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue = new ScheduledFetchQueue();
  private activeFetches = new Map<AssetId, ManagedAssetFetch>();
  private assetManifest: null | AssetManifest = null;

  constructor(
    private readonly remoteStore: RemoteAssetStore,
    private readonly cache: AssetCache,
    private readonly assetIdsByDefaultPrefetchPriority: Map<AssetId, AssetFetchPriority>,
    private readonly isOnline: () => boolean
  ) {}

  async initialize() {
    console.log("initializing ClientAppAssetService");
    const offline = !this.isOnline();
    if (offline) {
      // check if have a lastCachedManifest
      // check if cache containes all assets
      // check if manifest version matches game version
    }

    const upToDateVersionData = await this.getFreshAssetIdVersions();
    this.assetManifest = upToDateVersionData;

    console.log("initialized ClientAppAssetService");
  }

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const currentFetchOption = this.activeFetches.get(assetId);
    const isBeingFetched = currentFetchOption !== undefined;

    if (isBeingFetched) {
      const assetBytes = await currentFetchOption.promise;
      return assetBytes;
    }

    const scheduledFetchOption = this.prefetchQueue.remove(assetId);
    if (scheduledFetchOption !== undefined) {
      return this.startManagedFetch(assetId);
    }

    const assetInCacheOption = await this.cache.getAssetOption(assetId);
    invariant(assetInCacheOption !== undefined, "Asset was neither cached nor scheduled for fetch");

    return assetInCacheOption.bytes;
  }

  private async startManagedFetch(assetId: AssetId) {
    const { promise, abort } = this.remoteStore.getAssetBytesAbortable(assetId);

    const versionData = this.requireAssetManifestEntry(assetId);

    console.log("starting managed fetch for", assetId);
    const newFetch = new ManagedAssetFetch(promise, versionData, AssetFetchPriority.Urgent, abort);

    promise
      .then(async (bytes) => {
        console.log("managed fetch then clause");
        const versionedAsset = new VersionedAsset(bytes, versionData);
        console.log("fetched asset", assetId, bytes);

        await this.cache.cacheAsset(assetId, versionedAsset);
      })
      .catch((error) => {
        console.log("managed fetch catch clause");
        if (isAbortError(error)) {
          return;
        }
        console.log("error fetching asset:", error);
        throw error;
      })
      .finally(() => {
        console.log("managed fetch finally clause");
        this.activeFetches.delete(assetId);
        const updatesCompleted = this.activeFetches.size === 0 && this.prefetchQueue.isEmpty();

        if (updatesCompleted) {
          this.clearUnusedFromCache();
        }

        if (this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT) {
          this.startNextPrefetch();
        }
      });

    this.activeFetches.set(assetId, newFetch);

    const tooManyConcurrentFetches = this.activeFetches.size > TARGET_CONCURRENT_FETCH_COUNT;
    if (tooManyConcurrentFetches) {
      this.rescheduleLowPriorityFetches();
    }

    console.log("about to await promise");
    const result = await promise;
    console.log("after await promise");
    return result;
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

      this.prefetchQueue.add(managedFetchId, managedFetch.priority);
    }
  }

  private async startNextPrefetch() {
    const nextHighestPriorityFetch = this.prefetchQueue.popNextHighestPriority();
    if (nextHighestPriorityFetch === undefined) {
      return;
    }

    this.startManagedFetch(nextHighestPriorityFetch);
  }

  async startPrefetch() {
    console.log("starting prefetch");
    const needsUpdate = await this.getAssetIdsNeedingUpdate();
    console.log(needsUpdate.size, "assets need updates");

    for (const [assetId, versionData] of needsUpdate) {
      let defaultPriority = this.assetIdsByDefaultPrefetchPriority.get(assetId);
      if (defaultPriority === undefined) {
        defaultPriority = AssetFetchPriority.PrefetchLow;
      }

      this.prefetchQueue.add(assetId, defaultPriority);
    }

    while (
      this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT &&
      this.prefetchQueue.hasEntries()
    ) {
      console.log("starting next prefetch");
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

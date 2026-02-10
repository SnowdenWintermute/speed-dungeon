import { FetchAbortedError } from "../../../errors/fetch-aborted.js";
import { invariant } from "../../../utils/index.js";
import { ManagedAssetFetch } from "./managed-asset-fetch.js";
import { AssetFetchPriority, ScheduledFetchQueue } from "./scheduled-fetch-queue.js";
import { AssetCache, RemoteAssetStore } from "./stores/index.js";
import { AssetVersionData, VersionedAsset } from "./versioned-asset.js";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

const TARGET_CONCURRENT_FETCH_COUNT = 2;

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue = new ScheduledFetchQueue();
  private activeFetches = new Map<AssetId, ManagedAssetFetch>();
  private assetManifest: null | Map<AssetId, AssetVersionData> = new Map<
    AssetId,
    AssetVersionData
  >();

  constructor(
    private readonly remoteStore: RemoteAssetStore,
    private readonly cache: AssetCache,
    private readonly assetIdsByDefaultPrefetchPriority: Map<AssetId, AssetFetchPriority>,
    private readonly isOnline: () => boolean
  ) {}

  async initialize() {
    // get updated asset list
    this.assetManifest = await this.getFreshAssetIdVersions();
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
    const versionData = this.requireAssetVersionData(assetId);

    const newFetch = new ManagedAssetFetch(promise, versionData, AssetFetchPriority.Urgent, abort);

    newFetch.promise
      .then(async (bytes) => {
        const versionedAsset = new VersionedAsset(bytes, versionData);
        //   - store asset in cache
        await this.cache.cacheAsset(assetId, versionedAsset);
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
        }

        // on each fetch completed
        //   - if (currentFetchCount < TARGET_CONCURRENT_FETCH_COUNT) pop next and start fetching it
        if (this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT) {
          this.startNextPrefetch();
        }

        //   - update user facing asset fetch progress tracker
        //     - mark AssetId as completed
        //     - percent complete should reflect assets marked as completed based on their size in bytes
        //
      });

    this.activeFetches.set(assetId, newFetch);

    const tooManyConcurrentFetches = this.activeFetches.size > TARGET_CONCURRENT_FETCH_COUNT;
    if (tooManyConcurrentFetches) {
      this.rescheduleLowPriorityFetches();
    }

    const result = await promise;
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
    const needsUpdate = await this.getAssetIdsNeedingUpdate();
    // build prioritized list of assets to pre fetch
    for (const [assetId, versionData] of needsUpdate) {
      let defaultPriority = this.assetIdsByDefaultPrefetchPriority.get(assetId);
      if (defaultPriority === undefined) {
        defaultPriority = AssetFetchPriority.PrefetchLow;
      }

      this.prefetchQueue.add(assetId, defaultPriority);
    }

    // start fetching the first TARGET_CONCURRENT_FETCH_COUNT assets
    while (
      this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT &&
      this.prefetchQueue.hasEntries()
    ) {
      this.startNextPrefetch();
    }

    // initialize a user facing progress tracker
  }

  private async getAssetIdsNeedingUpdate() {
    // get updated asset list
    const updatedAssetList = this.requireAssetManifest();
    // compare to current cache
    const needsUpdate = new Map<AssetId, AssetVersionData>();
    const comparePromises: Promise<void>[] = [];
    for (const [assetId, assetVersionData] of updatedAssetList) {
      const checkIfMissingOrStale = new Promise<void>(() => {
        this.cache.getAssetOption(assetId).then((assetOption) => {
          const notCached = assetOption === undefined;
          if (notCached) {
            needsUpdate.set(assetId, assetVersionData);
            return;
          }

          const cachedAssetIsStale = assetOption.versionData.version !== assetVersionData.version;
          if (cachedAssetIsStale) {
            needsUpdate.set(assetId, assetVersionData);
          }
        });
      });
      comparePromises.push(checkIfMissingOrStale);
    }

    await Promise.all(comparePromises);

    return needsUpdate;
  }

  private async getFreshAssetIdVersions(): Promise<Map<AssetId, AssetVersionData>> {
    // http request to remote asset server
    throw new Error("not implemented");
  }

  private requireAssetManifest() {
    invariant(
      this.assetManifest !== null,
      "ClientAppAssetService was not initialized with updated asset list"
    );

    return this.assetManifest;
  }

  private requireAssetVersionData(assetId: AssetId) {
    const assetManifest = this.requireAssetManifest();
    const result = assetManifest.get(assetId);
    if (result === undefined) {
      throw new Error("Expected to have this asset in the version manifest");
    }
    return result;
  }

  private async clearUnusedFromCache() {
    const updatedAssetList = this.requireAssetManifest();
    await this.cache.removeAssetsNotIncluded(new Set(updatedAssetList.keys()));
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof FetchAbortedError;
}

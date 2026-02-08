import { invariant } from "../../../utils/index.js";
import { AssetStore } from "./stores/index.js";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

const TARGET_CONCURRENT_FETCH_COUNT = 2;

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

class ManagedAssetFetch {
  constructor(
    public promise: Promise<ArrayBuffer>,
    public priority: number,
    public abort: () => void,
    public sizeBytes: number // in case we need to abort and reschedule it
  ) {}

  isPreemptable() {
    return this.priority !== AssetFetchPriority.Urgent;
  }
}

interface IntentToFetch {
  assetId: AssetId;
  priority: number;
  sizeBytes: number;
}

interface VersionedAssetId {
  assetId: AssetId;
  sizeBytes: number;
  version: number;
}

export enum AssetFetchPriority {
  Urgent,
  PrefetchHigh,
  PrefetchLow,
}

class ScheduledFetchQueue {
  private scheduledFetches = new Map<AssetId, IntentToFetch>();

  remove(assetId: AssetId): IntentToFetch | undefined {
    const option = this.scheduledFetches.get(assetId);
    if (option) {
      this.scheduledFetches.delete(assetId);
      return option;
    } else {
      return undefined;
    }
  }

  add(intent: IntentToFetch) {
    this.scheduledFetches.set(intent.assetId, intent);
  }
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue = new ScheduledFetchQueue();
  private activeFetches = new Map<AssetId, ManagedAssetFetch>();

  constructor(
    private readonly remoteStore: AssetStore,
    private readonly cache: AssetStore,
    private readonly assetIdsByDefaultPrefetchPriority: IntentToFetch[],
    private readonly isOnline: () => boolean
  ) {}

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const currentFetchOption = this.activeFetches.get(assetId);
    const isBeingFetched = currentFetchOption !== undefined;
    if (isBeingFetched) {
      return currentFetchOption.promise;
    }

    const scheduledFetchOption = this.prefetchQueue.remove(assetId);
    if (scheduledFetchOption !== undefined) {
      const abortableFetch = this.remoteStore.getAssetBytesAbortable;
      invariant(abortableFetch !== undefined, "Expected remote store to have an abortable fetch");
      const { bytesPromise, abort } = abortableFetch(assetId);

      const newFetch = new ManagedAssetFetch(
        bytesPromise,
        AssetFetchPriority.Urgent,
        abort,
        scheduledFetchOption.sizeBytes
      );

      newFetch.promise
        .then((bytes) => {
          // race condition caching vs calling getAsset after cache started
          this.cache.cacheAsset(assetId, bytes);
        })
        .catch((error) => {
          if (isAbortError(error)) {
            return ABORTED_SENTINEL;
          }
          throw error;
        })
        .finally(() => {
          this.activeFetches.delete(assetId);
          // this.maybeStartNextPrefetch();
        });

      this.activeFetches.set(assetId, newFetch);

      const tooManyConcurrentFetches = this.activeFetches.size > TARGET_CONCURRENT_FETCH_COUNT;
      if (tooManyConcurrentFetches) {
        this.rescheduleLowPriorityFetches();
      }
      return bytesPromise;
    }

    const assetInCacheOption = await this.cache.getAssetBytesOption(assetId);
    invariant(assetInCacheOption !== undefined, "Asset was neither cached nor scheduled for fetch");

    return assetInCacheOption;
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
      this.activeFetches.delete(managedFetchId);
      const intentToFetch: IntentToFetch = {
        assetId: managedFetchId,
        priority: managedFetch.priority,
        sizeBytes: managedFetch.sizeBytes,
      };

      this.prefetchQueue.add(intentToFetch);
    }
  }

  async startPrefetch() {
    // get updated asset list
    // compare to current cache
    // build prioritized list of assets to pre fetch
    // create a user facing asset fetch progress tracker
    // start fetching the first TARGET_CONCURRENT_FETCH_COUNT assets
    // on each fetch completed
    //   - if an older entry is in the cache, delete it
    //   - store asset in cache
    //   - if (currentFetchCount < TARGET_CONCURRENT_FETCH_COUNT) pop next and start fetching it
    //   - update user facing asset fetch progress tracker
    //     - mark AssetId as completed
    //     - percent complete should reflect assets marked as completed based on their size in bytes
  }

  private async getAssetIdVersions(): Promise<VersionedAssetId[]> {
    // http request to remote asset server
    throw new Error("not implemented");
  }
}

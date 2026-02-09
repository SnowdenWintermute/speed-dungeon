import { FetchAbortedError } from "../../../errors/fetch-aborted.js";
import { invariant } from "../../../utils/index.js";
import { AssetCache, RemoteAssetStore } from "./stores/index.js";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

const TARGET_CONCURRENT_FETCH_COUNT = 2;

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

class ManagedAssetFetch {
  constructor(
    public promise: Promise<ArrayBuffer>,
    public versionData: AssetVersionData,
    public priority: number,
    public abort: () => void
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

interface AssetVersionData {
  sizeBytes: number;
  version: number;
}

export class VersionedAsset {
  constructor(
    public bytes: ArrayBuffer,
    public versionData: AssetVersionData
  ) {}
}

export enum AssetFetchPriority {
  Urgent,
  PrefetchHigh,
  PrefetchLow,
}

class ScheduledFetchQueue {
  // @TODO - really only need the asset id and the priority
  // because the manifest handles other metadata
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

  popNextHighestPriority() {
    // @PERFORMANCE - could be improved
    const sorted = Array.from(this.scheduledFetches.entries()).sort(
      ([aId, aIntent], [bId, bIntent]) => aIntent.priority - bIntent.priority
    );

    const next = sorted[0];
    if (next === undefined) {
      return undefined;
    } else {
      const assetId = next[0];
      const popped = this.scheduledFetches.get(assetId);
      invariant(popped !== undefined);
      this.scheduledFetches.delete(assetId);
      return popped;
    }
  }
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
        // this.maybeStartNextPrefetch();
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

      const intentToFetch: IntentToFetch = {
        assetId: managedFetchId,
        priority: managedFetch.priority,
        sizeBytes: managedFetch.versionData.sizeBytes,
      };

      this.prefetchQueue.add(intentToFetch);
    }
  }

  async startPrefetch() {
    // get updated asset list
    const updatedAssetList = await this.getFreshAssetIdVersions();
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
    // build prioritized list of assets to pre fetch
    for (const [assetId, versionData] of needsUpdate) {
      let defaultPriority = this.assetIdsByDefaultPrefetchPriority.get(assetId);
      if (defaultPriority === undefined) {
        defaultPriority = AssetFetchPriority.PrefetchLow;
      }

      this.prefetchQueue.add({
        assetId,
        priority: defaultPriority,
        sizeBytes: versionData.sizeBytes,
      });
    }

    // start fetching the first TARGET_CONCURRENT_FETCH_COUNT assets
    while (this.activeFetches.size < TARGET_CONCURRENT_FETCH_COUNT) {
      const nextHighestPriorityFetch = this.prefetchQueue.popNextHighestPriority();
      if (nextHighestPriorityFetch === undefined) {
        break;
      }

      this.startManagedFetch(nextHighestPriorityFetch.assetId);
    }
    //
    // on each fetch completed
    //   - if an older entry is in the cache, delete it
    //   - store asset in cache
    //   - if (currentFetchCount < TARGET_CONCURRENT_FETCH_COUNT) pop next and start fetching it
    //   - update user facing asset fetch progress tracker
    //     - mark AssetId as completed
    //     - percent complete should reflect assets marked as completed based on their size in bytes
    // create a user facing asset fetch progress tracker
  }

  private async getFreshAssetIdVersions(): Promise<Map<AssetId, AssetVersionData>> {
    // http request to remote asset server
    throw new Error("not implemented");
  }

  private requireAssetVersionData(assetId: AssetId) {
    if (this.assetManifest === null) {
      throw new Error("Haven't fetched the manifest yet");
    }
    const result = this.assetManifest.get(assetId);
    if (result === undefined) {
      throw new Error("Expected to have this asset in the version manifest");
    }
    return result;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof FetchAbortedError;
}

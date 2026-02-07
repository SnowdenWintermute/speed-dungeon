import { AssetStore } from "./stores/index.js";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

interface FetchEntry {
  promise: Promise<ArrayBuffer>;
  priority: number;
  abort: () => void;
}

interface PrefetchEntry {
  assetId: AssetId;
  priority: number;
}

export enum AssetFetchPriority {
  Urgent,
  PrefetchHigh,
  PrefetchLow,
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue: PrefetchEntry[] = [];
  private fetchesInProgress = new Map<AssetId, FetchEntry>();

  constructor(
    private readonly remoteStore: AssetStore,
    private readonly cache: AssetStore,
    private readonly assetIdsByDefaultPrefetchPriority: PrefetchEntry[],
    private readonly isOnline: () => boolean
  ) {}

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    try {
      return await this.cache.getAssetBytes(assetId).bytesFetch;
    } catch (error) {
      console.log(`${assetId} not found in cache: ${error}`);
    }

    return await this.fetchAndCacheRemoteAssetOrGetAlreadyQueuedFetch(
      assetId,
      AssetFetchPriority.Urgent
    );
  }

  async prefetchAssets() {
    const recentAssetIdVersions = await this.getAssetIdVersions();
    // @TODO - compare to cache and build list of updateable AssetIds to fetch

    for (const assetId of recentAssetIdVersions) {
      this.prefetchQueue.push({ assetId, priority: AssetFetchPriority.PrefetchLow });
    }
  }

  private async fetchAndCacheRemoteAssetOrGetAlreadyQueuedFetch(
    assetId: AssetId,
    priority: number
  ): Promise<ArrayBuffer> {
    if (!this.isOnline()) {
      throw new Error("Can't fetch asset - no internet connection");
    }

    const existing = this.fetchesInProgress.get(assetId);
    if (existing) {
      existing.priority = priority;
      return existing.promise;
    }

    const { fetchThenCache, abortController } = this.fetchAndCacheRemoteAsset(assetId);
    this.fetchesInProgress.set(assetId, {
      promise: fetchThenCache,
      priority,
      abort: () => abortController.abort(),
    });

    fetchThenCache.finally(() => {
      this.fetchesInProgress.delete(assetId);
      // also remove from prefetchQueue if it was queued
    });

    return fetchThenCache;
  }

  private fetchAndCacheRemoteAsset(assetId: AssetId) {
    const { bytesFetch, abortController } = this.remoteStore.getAssetBytes(assetId);
    const fetchThenCache = new Promise<ArrayBuffer>((resolve) => {
      bytesFetch.then((bytes) => {
        this.cache.cacheAsset(assetId, bytes);
        resolve(bytes);
      });
    });

    return { fetchThenCache, abortController };
  }

  async getAssetIdVersions(): Promise<AssetId[]> {
    throw new Error("not implemented");
  }
}

import path from "path";
import fs from "fs";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

// ArrayBuffer format was chosen because it works in all runtimes, node, browser etc.
export interface AssetStore {
  getAssetBytes(assetId: AssetId): Promise<ArrayBuffer>;
  cacheAsset(assetId: AssetId, bytes: ArrayBuffer): Promise<void>;
}

export class HttpAssetStore implements AssetStore {
  constructor(private readonly baseUrl: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/${assetId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${assetId}`);
    }
    return await res.arrayBuffer();
  }

  async cacheAsset(): Promise<void> {
    throw new Error("Can't cache to the http source");
  }
}

export class FileSystemAssetStore implements AssetStore {
  private baseRealPath = "";
  constructor(private readonly baseDir: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    if (!this.baseRealPath) {
      this.baseRealPath = await fs.promises.realpath(this.baseDir);
    }

    const candidatePath = path.resolve(this.baseRealPath, assetId);
    const candidateRealPath = await fs.promises.realpath(candidatePath);
    const relative = path.relative(this.baseRealPath, candidateRealPath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Directory traversal attempt");
    }

    const buffer = await fs.promises.readFile(candidateRealPath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  async cacheAsset(): Promise<void> {
    // @TODO
  }
}

export class IndexedDbAssetStore implements AssetStore {
  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const entry = await readFromIndexedDb(assetId);
    if (!entry) {
      throw new Error(`Asset not in cache: ${assetId}`);
    }
    return entry;
  }

  async cacheAsset(): Promise<void> {
    // @TODO
  }
}

async function readFromIndexedDb(id: string): Promise<ArrayBuffer> {
  throw new Error("not implemented");
}

export interface AssetService {
  /**
   * Returns the bytes for a given logical asset.
   * Throws if the asset is unavailable (e.g., offline & not cached).
   */
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

interface FetchEntry {
  promise: Promise<ArrayBuffer>;
  priority: number;
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
      return await this.cache.getAssetBytes(assetId);
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

    const fetchAndCachePromise = this.fetchAndCacheRemoteAsset(assetId);
    this.fetchesInProgress.set(assetId, { promise: fetchAndCachePromise, priority });

    fetchAndCachePromise.finally(() => {
      this.fetchesInProgress.delete(assetId);
      // also remove from prefetchQueue if it was queued
    });

    return fetchAndCachePromise;
  }

  private async fetchAndCacheRemoteAsset(assetId: AssetId) {
    const bytes = await this.remoteStore.getAssetBytes(assetId);
    this.cache.cacheAsset(assetId, bytes);
    return bytes;
  }

  async getAssetIdVersions(): Promise<AssetId[]> {
    throw new Error("not implemented");
  }
}

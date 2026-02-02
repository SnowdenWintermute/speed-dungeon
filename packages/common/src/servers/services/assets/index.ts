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

  /**
   * Optional: pre-fetch or synchronize assets ahead of time.
   * Can be used by the synchronizer in online mode.
   */
  ensureAsset(assetId: AssetId): Promise<void>;
}

interface FetchEntry {
  promise: Promise<ArrayBuffer>;
  priority: number;
}

interface PrefetchEntry {
  assetId: AssetId;
  priority: number;
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue: PrefetchEntry[] = [];
  private inProgress = new Map<AssetId, FetchEntry>();

  constructor(
    private readonly httpStore: AssetStore,
    private readonly cache: AssetStore,
    private readonly isOnline: () => boolean
  ) {}

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    if (!this.isOnline()) {
      return this.cache.getAssetBytes(assetId);
    }

    try {
      return await this.cache.getAssetBytes(assetId);
    } catch (error) {
      console.log(`${assetId} not found in cache: ${error}`);
    }

    const bytes = await this.httpStore.getAssetBytes(assetId);
    await this.cacheAsset(assetId, bytes);

    return bytes;
  }

  async fetchAsset(assetId: AssetId, priority: number): Promise<ArrayBuffer> {
    const existing = this.inProgress.get(assetId);
    if (existing) {
      // already being fetched; maybe update priority
      if (priority > existing.priority) {
        existing.priority = priority;
        // optionally reorder queue if used for background fetching
      }
      return existing.promise;
    }

    // start a new fetch
    const fetchPromise = this.ensureAsset(assetId);
    this.inProgress.set(assetId, { promise: fetchPromise, priority });

    fetchPromise.finally(() => {
      this.inProgress.delete(assetId);
      // also remove from prefetchQueue if it was queued
    });

    return fetchPromise;
  }

  async getUpdatedAssetIds(): Promise<AssetId[]> {
    throw new Error("not implemented");
  }

  async ensureAsset(assetId: AssetId): Promise<void> {
    if (!this.isOnline()) {
      return;
    }

    const bytes = await this.httpStore.getAssetBytes(assetId);
    await this.cacheAsset(assetId, bytes);
  }

  private async checkForUpdate(assetId: AssetId, cached: ArrayBuffer): Promise<boolean> {
    // Optional: fetch a hash, ETag, or version number from server
    // Return true if server version is newer
    return true; // placeholder, always fetch for now
  }

  private async cacheAsset(assetId: AssetId, bytes: ArrayBuffer) {
    await this.cache.cacheAsset(assetId, bytes);
  }
}

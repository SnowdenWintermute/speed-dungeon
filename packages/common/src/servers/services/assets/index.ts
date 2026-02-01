import path from "path";
import fs from "fs";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" };
export interface AssetSource {
  // ArrayBuffer format works in all runtimes, node, browser etc.
  getAssetBytes(assetId: AssetId): Promise<ArrayBuffer>;
}

export class HttpAssetSource implements AssetSource {
  constructor(private readonly baseUrl: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/${assetId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${assetId}`);
    }
    return await res.arrayBuffer();
  }
}

export class FileSystemAssetSource implements AssetSource {
  constructor(private readonly baseDir: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const fullPath = path.join(this.baseDir, assetId);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error("Directory traversal attempt");
    }
    const buffer = await fs.promises.readFile(fullPath);
    const asArrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    return asArrayBuffer;
  }
}

export class IndexedDbAssetSource implements AssetSource {
  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const entry = await readFromIndexedDb(assetId);
    if (!entry) {
      throw new Error(`Asset not in cache: ${assetId}`);
    }
    return entry;
  }
}

async function readFromIndexedDb(id: string): Promise<ArrayBuffer> {
  throw new Error("not implemented");
}

export class FallbackAssetSource implements AssetSource {
  constructor(private readonly sources: AssetSource[]) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    for (const source of this.sources) {
      try {
        return await source.getAssetBytes(assetId);
      } catch {
        console.error("couldn't get asset bytes");
      }
    }
    throw new Error(`Asset not found in any source: ${assetId}`);
  }
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

export class AppClientAssetService implements AssetService {
  constructor(
    private readonly httpSource: AssetSource,
    private readonly cacheSource: AssetSource,
    private readonly isOnline: () => boolean
  ) {}

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    if (this.isOnline()) {
      try {
        // Check cache first
        let cached: ArrayBuffer | null = null;
        try {
          cached = await this.cacheSource.getAssetBytes(assetId);
        } catch {
          // ignore, cache miss
        }

        // Always check for update if cached
        if (cached) {
          const updated = await this.checkForUpdate(assetId, cached);
          if (!updated) return cached;
        }

        // Fetch from HTTP if not cached or updated
        const bytes = await this.httpSource.getAssetBytes(assetId);

        // Store/update cache
        await this.storeInCache(assetId, bytes);
        return bytes;
      } catch (err) {
        // fallback to cache if available
        try {
          return await this.cacheSource.getAssetBytes(assetId);
        } catch {
          throw new Error(`Unable to load asset ${assetId} online or from cache`);
        }
      }
    } else {
      // offline: must be in cache
      return this.cacheSource.getAssetBytes(assetId);
    }
  }

  async ensureAsset(assetId: AssetId): Promise<void> {
    if (!this.isOnline()) return; // can't fetch

    const bytes = await this.httpSource.getAssetBytes(assetId);
    await this.storeInCache(assetId, bytes);
  }

  private async checkForUpdate(assetId: AssetId, cached: ArrayBuffer): Promise<boolean> {
    // Optional: fetch a hash, ETag, or version number from server
    // Return true if server version is newer
    return true; // placeholder, always fetch for now
  }

  private async storeInCache(assetId: AssetId, bytes: ArrayBuffer) {
    // Store in IndexedDB, Capacitor FS, or other cache source
    if ("storeAssetBytes" in this.cacheSource) {
      await (this.cacheSource as any).storeAssetBytes(assetId, bytes);
    }
  }
}

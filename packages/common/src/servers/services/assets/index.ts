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

// @TODO
// Online mode runs a synchronizer ahead of time. Offline mode does not. Consumers remain oblivious.
export interface AssetSynchronizer {
  ensureAsset(assetId: AssetId): Promise<void>;
}

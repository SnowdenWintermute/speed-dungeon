import { AssetId } from "../index.js";
import { AssetStore } from "./index.js";

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

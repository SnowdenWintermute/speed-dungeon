import { AssetId, VersionedAsset } from "../index.js";
import { AssetCache } from "./index.js";

export class IndexedDbAssetStore extends AssetCache {
  removeAsset(assetId: AssetId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getAssetIdsCached(): Promise<Set<AssetId>> {
    throw new Error("Method not implemented.");
  }
  async getAsset(assetId: AssetId): Promise<VersionedAsset> {
    const assetOption = await this.getAssetOption(assetId);
    if (assetOption === undefined) {
      throw new Error(`Asset not in cache: ${assetId}`);
    }
    return assetOption;
  }

  async getAssetOption(assetId: AssetId): Promise<VersionedAsset | undefined> {
    const entry = await readFromIndexedDb(assetId);
    if (!entry) {
      return undefined;
    }
    return entry;
  }

  async cacheAsset(): Promise<void> {
    // @TODO
  }
}

async function readFromIndexedDb(id: string): Promise<VersionedAsset | undefined> {
  throw new Error("not implemented");
}

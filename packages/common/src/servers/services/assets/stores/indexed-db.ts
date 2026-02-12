import { AssetId } from "../index.js";
import { VersionedAsset } from "../versioned-asset.js";
import { AssetCache } from "./index.js";
import { IndexedDbVersionedAssetRepo } from "./indexed-db-versioned-asset-repo.js";

export class IndexedDbAssetStore extends AssetCache {
  indexedDbAssetsRepo: IndexedDbVersionedAssetRepo;
  constructor(indexedDB: IDBFactory) {
    super();
    this.indexedDbAssetsRepo = new IndexedDbVersionedAssetRepo(indexedDB);
  }

  async removeAsset(assetId: AssetId): Promise<void> {
    await this.indexedDbAssetsRepo.delete(assetId);
  }

  async getAssetIdsCached(): Promise<Set<AssetId>> {
    return await this.indexedDbAssetsRepo.getAllKeys();
  }

  async getAsset(assetId: AssetId): Promise<VersionedAsset> {
    const assetOption = await this.getAssetOption(assetId);
    if (assetOption === undefined) {
      throw new Error(`Asset not in cache: ${assetId}`);
    }
    return assetOption;
  }

  async getAssetOption(assetId: AssetId): Promise<VersionedAsset | undefined> {
    return await this.indexedDbAssetsRepo.findById(assetId);
  }

  async cacheAsset(assetId: AssetId, versionedAsset: VersionedAsset): Promise<void> {
    await this.indexedDbAssetsRepo.insert(assetId, versionedAsset);
  }
}

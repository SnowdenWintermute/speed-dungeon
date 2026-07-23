import { AssetId, AssetService } from "./index.js";
import { AssetCache } from "./stores/index.js";

export class LocalStoreAssetService implements AssetService {
  constructor(private localStore: AssetCache) {}
  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const versionedAsset = await this.localStore.getAsset(assetId);
    return versionedAsset.bytes;
  }
}

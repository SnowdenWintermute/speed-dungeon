import { AssetId, AssetService } from "./index.js";
import { AssetCache } from "./stores/index.js";

export class GameServerNodeAssetService implements AssetService {
  constructor(private localFileSystemStore: AssetCache) {}
  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    const versionedAsset = await this.localFileSystemStore.getAsset(assetId);
    return versionedAsset.bytes;
  }
}

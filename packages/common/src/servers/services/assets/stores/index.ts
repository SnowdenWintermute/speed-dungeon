import { AssetId, VersionedAsset } from "../index.js";

export interface AbortableAssetFetch {
  promise: Promise<ArrayBuffer>;
  abort: () => void;
}

export abstract class RemoteAssetStore {
  abstract getAssetBytes(assetId: AssetId): Promise<ArrayBuffer>;
  abstract getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch;
}

/** A store we can cache to
 * ArrayBuffer format was chosen because it works in all runtimes, node, browser etc.*/
export abstract class AssetCache {
  abstract getAsset(assetId: AssetId): Promise<VersionedAsset>;
  abstract cacheAsset(assetId: AssetId, asset: VersionedAsset): Promise<void>;
  abstract getAssetOption(assetId: AssetId): Promise<VersionedAsset | undefined>;
  /** return true if asset existed */
  abstract removeAsset(assetId: AssetId): Promise<boolean>;
  abstract getAssetIdsCached(): Promise<Set<AssetId>>;

  async removeAssetsNotIncluded(toKeep: Set<AssetId>) {
    const allCachedAssetIds = await this.getAssetIdsCached();

    await Promise.all(
      [...allCachedAssetIds]
        .filter((assetId) => !toKeep.has(assetId))
        .map((assetId) => this.removeAsset(assetId))
    );
  }
}

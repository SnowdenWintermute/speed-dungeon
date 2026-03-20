import { AssetId } from "../index.js";
import { AssetManifest, VersionedAsset } from "../versioned-asset.js";

export interface AbortableAssetFetch {
  promise: Promise<ArrayBuffer>;
  abort: () => void;
}

export abstract class RemoteAssetStore {
  abstract getAssetBytes(assetId: AssetId): Promise<ArrayBuffer>;
  abstract getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch;
  abstract getAssetManifest(): Promise<AssetManifest>;
}

/** A store we can cache to. Base class to be extended based on the runtime.
 * ArrayBuffer format was chosen because it works in all runtimes, node, browser etc.*/
export abstract class AssetCache {
  abstract getAsset(assetId: AssetId): Promise<VersionedAsset>;
  abstract cacheAsset(assetId: AssetId, asset: VersionedAsset): Promise<void>;
  abstract getAssetOption(assetId: AssetId): Promise<VersionedAsset | undefined>;
  /** return true if asset existed */
  abstract removeAsset(assetId: AssetId): Promise<void>;
  abstract getAssetIdsCached(): Promise<Set<AssetId>>;

  abstract clear(): Promise<void>;

  async removeAssetsNotIncluded(toKeep: Set<AssetId>) {
    const allCachedAssetIds = await this.getAssetIdsCached();

    await Promise.all(
      [...allCachedAssetIds]
        .filter((assetId) => !toKeep.has(assetId))
        .map((assetId) => this.removeAsset(assetId))
    );
  }
}

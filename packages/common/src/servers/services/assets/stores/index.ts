import { AssetId } from "../index.js";

// ArrayBuffer format was chosen because it works in all runtimes, node, browser etc.
export interface AssetStore {
  getAssetBytes(assetId: AssetId): {
    bytesFetch: Promise<ArrayBuffer>;
    abortController: AbortController;
  };
  cacheAsset(assetId: AssetId, bytes: ArrayBuffer): Promise<void>;
}

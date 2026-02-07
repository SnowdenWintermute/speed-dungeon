import { AssetId } from "../index.js";

export interface AbortableGetBytes {
  bytesPromise: Promise<ArrayBuffer>;
  abort: () => void;
}

// ArrayBuffer format was chosen because it works in all runtimes, node, browser etc.
export interface AssetStore {
  getAssetBytes(assetId: AssetId): Promise<ArrayBuffer>;
  getAssetBytesAbortable?(assetId: AssetId): AbortableGetBytes;
  cacheAsset(assetId: AssetId, bytes: ArrayBuffer): Promise<void>;
}

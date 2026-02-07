import { AssetId } from "../index.js";
import { AbortableGetBytes, AssetStore } from "./index.js";

export class RemoteServerAssetStore implements AssetStore {
  constructor(private readonly baseUrl: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/${assetId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${assetId}`);
    }

    return res.arrayBuffer();
  }

  getAssetBytesAbortable(assetId: AssetId): AbortableGetBytes {
    const abortController = new AbortController();
    const bytesPromise = new Promise<ArrayBuffer>((resolve, reject) => {
      fetch(`${this.baseUrl}/${assetId}`, { signal: abortController.signal }).then((res) => {
        if (!res.ok) {
          reject(new Error(`Failed to fetch asset ${assetId}`));
        }

        resolve(res.arrayBuffer());
      });
    });
    return { bytesPromise, abort: abortController.abort };
  }

  async cacheAsset(): Promise<void> {
    throw new Error("Can't cache to the http source");
  }
}

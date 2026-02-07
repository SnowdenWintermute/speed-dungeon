import { AssetId } from "../index.js";
import { AssetStore } from "./index.js";

export class RemoteServerAssetStore implements AssetStore {
  constructor(private readonly baseUrl: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/${assetId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${assetId}`);
    }
    return await res.arrayBuffer();
  }

  async cacheAsset(): Promise<void> {
    throw new Error("Can't cache to the http source");
  }
}

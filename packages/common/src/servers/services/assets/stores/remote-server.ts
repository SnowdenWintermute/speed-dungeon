import { FetchAbortedError } from "../../../../errors/fetch-aborted.js";
import { AssetId } from "../index.js";
import { AbortableAssetFetch, RemoteAssetStore } from "./index.js";

export class RemoteServerAssetStore implements RemoteAssetStore {
  constructor(private readonly baseUrl: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/${assetId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${assetId}`);
    }

    return res.arrayBuffer();
  }

  async getAssetBytesOption(assetId: AssetId): Promise<ArrayBuffer | undefined> {
    try {
      const asset = await this.getAssetBytes(assetId);
      return asset;
    } catch {
      return undefined;
    }
  }

  getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch {
    const abortController = new AbortController();
    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
      fetch(`${this.baseUrl}/${assetId}`, { signal: abortController.signal })
        .then((res) => {
          if (!res.ok) {
            reject(new Error(`Failed to fetch asset ${assetId}`));
          }

          resolve(res.arrayBuffer());
        })
        .catch((err) => {
          if (abortController.signal.aborted) {
            throw new FetchAbortedError();
          }
          throw err;
        });
    });
    return { promise, abort: () => abortController.abort() };
  }
}

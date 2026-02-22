import { FetchAbortedError } from "../../../../errors/fetch-aborted.js";
import { AssetId } from "../index.js";
import { AssetManifest } from "../versioned-asset.js";
import { AbortableAssetFetch, RemoteAssetStore } from "./index.js";

export class RemoteServerAssetStore implements RemoteAssetStore {
  constructor(private readonly baseUrl: string) {}
  async getAssetManifest(): Promise<AssetManifest> {
    const res = await fetch(`${this.baseUrl}/asset-manifest`);
    const manifest = await res.json();
    return manifest;
  }

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
      const url = `${this.baseUrl}/assets/${assetId}`;

      fetch(url, { signal: abortController.signal })
        .then((res) => {
          if (!res.ok) {
            reject(new Error(`Failed to fetch asset ${assetId}`));
          }

          res.arrayBuffer().then((bytes) => {
            resolve(bytes);
          });
        })
        .catch((err) => {
          if (abortController.signal.aborted) {
            console.log("fetch aborted:", assetId);
            reject(new FetchAbortedError());
          }
          reject(err);
        });
    });
    return { promise, abort: () => abortController.abort() };
  }
}

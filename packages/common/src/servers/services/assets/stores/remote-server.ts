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
      console.log(res.status);
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

      console.log("getAssetBytesAbortable promise starting");

      fetch(url, { signal: abortController.signal })
        .then((res) => {
          console.log("fetch then clause");
          if (!res.ok) {
            console.log("abortable fetch error status:", res.status, "url:", url);
            reject(new Error(`Failed to fetch asset ${assetId}`));
          }

          resolve(res.arrayBuffer());
        })
        .catch((err) => {
          console.log("error with abortable fetch:", err);
          if (abortController.signal.aborted) {
            throw new FetchAbortedError();
          }
          reject(err);
        });
    });
    return { promise, abort: () => abortController.abort() };
  }
}

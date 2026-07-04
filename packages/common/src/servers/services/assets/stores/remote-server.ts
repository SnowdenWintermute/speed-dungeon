import { FetchAbortedError } from "../../../../errors/fetch-aborted.js";
import { AssetId } from "../index.js";
import { MapUtils } from "../../../../utils/map-utils.js";
import { AssetManifest, SerializedAssetManifest } from "../versioned-asset.js";
import { AbortableAssetFetch, RemoteAssetStore } from "./index.js";

export class RemoteServerAssetStore extends RemoteAssetStore {
  constructor(private readonly baseUrl: string) {
    super();
  }

  override async getAssetManifest(): Promise<AssetManifest> {
    const url = `${this.baseUrl}/asset-manifest`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`asset manifest fetch failed: ${res.status} ${res.statusText}`);
    }
    const serialized: SerializedAssetManifest = await res.json();
    return MapUtils.deserialize(serialized);
  }

  protected override async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
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

  override getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch {
    const abortController = new AbortController();
    const url = `${this.baseUrl}/assets/${assetId}`;

    const promise = fetch(url, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch asset ${assetId}`);
        }

        return res.arrayBuffer();
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          throw new FetchAbortedError();
        }

        throw err;
      });

    return { promise, abort: () => abortController.abort() };
  }
}

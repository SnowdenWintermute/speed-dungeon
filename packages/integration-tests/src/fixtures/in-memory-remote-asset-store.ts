import {
  AbortableAssetFetch,
  AssetId,
  AssetManifest,
  RemoteAssetStore,
} from "@speed-dungeon/common";

// Test double for the remote (HTTP) asset store. The integration harness has no real HTTP asset
// server, so we serve a canned manifest and byte set from memory. Defaults to an empty manifest,
// which means no assets to prefetch.
export class InMemoryRemoteAssetStore implements RemoteAssetStore {
  constructor(
    private readonly manifest: AssetManifest = {},
    private readonly bytesById: Map<AssetId, ArrayBuffer> = new Map()
  ) {}

  async getAssetManifest(): Promise<AssetManifest> {
    return this.manifest;
  }

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const bytes = this.bytesById.get(assetId);
    if (bytes === undefined) {
      throw new Error(`no fake asset bytes registered for ${assetId}`);
    }
    return bytes;
  }

  getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch {
    return { promise: this.getAssetBytes(assetId), abort: () => {} };
  }
}

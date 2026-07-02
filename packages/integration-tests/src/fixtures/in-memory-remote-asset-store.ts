import {
  AbortableAssetFetch,
  AssetId,
  AssetManifest,
  RemoteAssetStore,
} from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";

// Test double for the remote (HTTP) asset store. The integration harness has no real HTTP asset
// server, so we serve a canned manifest and byte set from memory. Defaults to an empty manifest,
// which means no assets to prefetch.
export class InMemoryRemoteAssetStore implements RemoteAssetStore {
  private readonly manifest: AssetManifest = {};
  private manifestCreated = false;
  constructor(private readonly localFileSystemStore: NodeFileSystemAssetStore) {}

  async getAssetManifest(): Promise<AssetManifest> {
    if (!this.manifestCreated) {
      await this.createManifest();
    }
    return this.manifest;
  }

  async createManifest() {
    const assetIds = await this.localFileSystemStore.getAssetIdsCached();

    for (const id of assetIds) {
      const asset = await this.localFileSystemStore.getAsset(id);
      this.manifest[id] = asset.versionData;
    }

    this.manifestCreated = true;
  }

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const asset = await this.localFileSystemStore.getAsset(assetId);

    return asset.bytes;
  }

  getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch {
    return { promise: this.getAssetBytes(assetId), abort: () => {} };
  }
}

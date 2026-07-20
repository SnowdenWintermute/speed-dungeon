import {
  AbortableAssetFetch,
  AssetId,
  AssetManifest,
  AssetVersionData,
  FetchAbortedError,
  invariant,
  RemoteAssetStore,
} from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";

// Test double for the remote (HTTP) asset store. The integration harness has no real HTTP asset
// server, so we serve a canned manifest and byte set from memory. Defaults to an empty manifest,
// which means no assets to prefetch.
export class InMemoryRemoteAssetStore extends RemoteAssetStore {
  private readonly manifest: AssetManifest = new Map();
  private manifestCreated = false;
  readonly pendingFetches = new Map<
    AssetId,
    {
      resolve: (bytes: ArrayBuffer) => void;
      reject: (err: unknown) => void;
    }
  >();

  constructor(private readonly localFileSystemStore: NodeFileSystemAssetStore) {
    super();
  }

  override async getAssetManifest(): Promise<AssetManifest> {
    if (!this.manifestCreated) {
      await this.createManifest();
    }
    return this.manifest;
  }

  private async createManifest() {
    const assetIds = await this.localFileSystemStore.getAssetIdsCached();

    for (const id of assetIds) {
      const asset = await this.localFileSystemStore.getAsset(id);
      this.manifest.set(id, asset.versionData);
    }

    this.manifestCreated = true;
  }

  modifyManifestAssetVersion(id: AssetId, newData: AssetVersionData) {
    this.manifest.set(id, newData);
  }

  protected override async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
    const asset = await this.localFileSystemStore.getAsset(assetId);

    return asset.bytes;
  }

  // allows for manually aborting and resolving fetches from tests
  getAssetBytesAbortable(assetId: AssetId): AbortableAssetFetch {
    invariant(!this.pendingFetches.has(assetId)); // don't overwrite pending fetches with a leaked promise
    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
      this.pendingFetches.set(assetId, { resolve, reject });
    });
    return {
      promise,
      abort: () => {
        this.abortFetch(assetId);
      },
    };
  }

  async resolveFetch(assetId: AssetId) {
    const pendingFetch = this.takeRequiredPendingFetch(assetId);
    pendingFetch.resolve(await this.getAssetBytes(assetId));
  }

  private abortFetch(assetId: AssetId) {
    this.takeRequiredPendingFetch(assetId).reject(new FetchAbortedError());
  }

  failFetch(assetId: AssetId, error = new Error("fetch failed")) {
    this.takeRequiredPendingFetch(assetId).reject(error);
  }

  private takeRequiredPendingFetch(assetId: AssetId) {
    const pendingFetch = this.pendingFetches.get(assetId);
    invariant(pendingFetch !== undefined, `no pending fetch for ${assetId}`);
    this.pendingFetches.delete(assetId);
    return pendingFetch;
  }
}

import { AssetId, AssetManifest, AssetVersionData, invariant } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class AssetFetchProgressStore {
  initialized: boolean = false;
  totalBytesFetching: number = 0;
  totalBytesFetched: number = 0;
  fetchCompletions = new Map<
    AssetId,
    {
      sizeBytes: number;
      started: boolean;
      aborted: boolean;
      isComplete: boolean;
      wasCached: boolean;
    }
  >();

  constructor() {
    makeAutoObservable(this);
  }

  get displayPercent() {
    const percent = Math.round(this.percentComplete);
    if (isNaN(percent)) {
      return 100;
    }
    return percent;
  }

  get isComplete() {
    return this.displayPercent === 100;
  }

  initialize(manifest: AssetManifest, newQueue: Map<AssetId, AssetVersionData>) {
    this.initialized = true;
    this.totalBytesFetched = 0;

    let totalBytesFetching = 0;
    Object.entries(manifest).forEach(([untypedAssetId, versionData]) => {
      const assetId = untypedAssetId as AssetId;
      const { sizeBytes } = versionData;
      const needsUpdate = newQueue.has(assetId);

      const wasCached = !needsUpdate;
      if (wasCached) {
        this.totalBytesFetched += sizeBytes;
      }

      this.fetchCompletions.set(assetId, {
        sizeBytes,
        started: false,
        aborted: false,
        isComplete: wasCached,
        wasCached,
      });
      totalBytesFetching += sizeBytes;
    });

    this.totalBytesFetching = totalBytesFetching;
  }

  onFetchStart(assetId: AssetId) {
    const entry = this.fetchCompletions.get(assetId);
    invariant(entry !== undefined, "got fetch completion for an asset not on our list");
    entry.aborted = false;
    entry.started = true;
  }

  onFetchAbort(assetId: AssetId) {
    const entry = this.fetchCompletions.get(assetId);
    invariant(entry !== undefined, "got fetch completion for an asset not on our list");
    entry.aborted = true;
  }

  onFetchComplete(assetId: AssetId) {
    const entry = this.fetchCompletions.get(assetId);
    invariant(entry !== undefined, "got fetch completion for an asset not on our list");
    entry.isComplete = true;
    this.totalBytesFetched += entry.sizeBytes;
  }

  get percentComplete() {
    const remaining = this.totalBytesFetching - this.totalBytesFetched;
    const percent = 100 - (remaining / this.totalBytesFetching) * 100;
    return percent;
  }
}

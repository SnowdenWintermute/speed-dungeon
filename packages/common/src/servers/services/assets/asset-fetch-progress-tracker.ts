import { makeAutoObservable } from "mobx";
import { AssetId } from "./index.js";
import { AssetManifest, AssetVersionData } from "./versioned-asset.js";
import { invariant } from "../../../utils/index.js";

export class AssetFetchProgressTracker {
  initialized: boolean = false;
  private _fetchFailed: boolean = false;
  totalBytesFetching: number = 0;
  totalBytesFetched: number = 0;
  fetches = new Map<
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

  set fetchFailed(value: boolean) {
    this._fetchFailed = value;
  }

  get fetchFailed() {
    return this._fetchFailed;
  }

  get displayPercent() {
    const percent = Math.round(this.percentComplete);
    if (isNaN(percent)) {
      return 100;
    }
    return percent;
  }

  get isComplete() {
    return this.initialized && this.displayPercent === 100;
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

      this.fetches.set(assetId, {
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
    const entry = this.fetches.get(assetId);
    invariant(entry !== undefined, "got fetch completion for an asset not on our list");
    entry.aborted = false;
    entry.started = true;
  }

  onFetchAbort(assetId: AssetId) {
    const entry = this.fetches.get(assetId);
    invariant(entry !== undefined, "got fetch completion for an asset not on our list");
    entry.aborted = true;
  }

  onFetchComplete(assetId: AssetId) {
    const entry = this.fetches.get(assetId);
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

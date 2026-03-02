import { AssetId, AssetVersionData, invariant } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class AssetFetchProgressStore {
  initialized: boolean = false;
  totalBytesFetching: number = 0;
  totalBytesFetched: number = 0;
  fetchCompletions = new Map<AssetId, { sizeBytes: number; isComplete: boolean }>();

  constructor() {
    makeAutoObservable(this);
  }

  initialize(newQueue: Map<AssetId, AssetVersionData>) {
    this.initialized = true;

    let totalBytesFetching = 0;
    Array.from(newQueue).forEach(([assetId, versionData]) => {
      const { sizeBytes } = versionData;
      this.fetchCompletions.set(assetId, { sizeBytes, isComplete: false });
      totalBytesFetching += sizeBytes;
    });

    this.totalBytesFetching = totalBytesFetching;
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

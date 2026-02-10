import { AssetFetchPriority } from "./scheduled-fetch-queue.js";
import { AssetVersionData } from "./versioned-asset.js";

export class ManagedAssetFetch {
  constructor(
    public promise: Promise<ArrayBuffer>,
    public versionData: AssetVersionData,
    public priority: number,
    public abort: () => void
  ) {}

  isPreemptable() {
    return this.priority !== AssetFetchPriority.Urgent;
  }
}

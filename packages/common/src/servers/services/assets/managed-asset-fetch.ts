import { NormalizedPercentage } from "../../../aliases.js";
import { AssetFetchPriority } from "./scheduled-fetch-queue.js";
import { AssetVersionData } from "./versioned-asset.js";

export class ManagedAssetFetch {
  public percentFetched: NormalizedPercentage = 0;
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

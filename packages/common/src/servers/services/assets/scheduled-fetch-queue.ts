import { invariant, iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { AssetId } from "./index.js";

export enum AssetFetchPriority {
  Urgent,
  PrefetchHigh,
  PrefetchLow,
}

export class ScheduledFetchQueue {
  private idsByPriority: Record<AssetFetchPriority, Set<AssetId>> = {
    [AssetFetchPriority.PrefetchLow]: new Set(),
    [AssetFetchPriority.PrefetchHigh]: new Set(),
    [AssetFetchPriority.Urgent]: new Set(),
  };
  private prioritiesById = new Map<AssetId, AssetFetchPriority>();

  remove(assetId: AssetId) {
    const option = this.prioritiesById.get(assetId);
    if (option) {
      this.prioritiesById.delete(assetId);
      this.getIdsAtPriority(option).delete(assetId);
    }
  }

  private getIdsAtPriority(priority: AssetFetchPriority) {
    const result = this.idsByPriority[priority];
    return result;
  }

  add(assetId: AssetId, priority: AssetFetchPriority) {
    invariant(!this.prioritiesById.has(assetId), "entry already exists");
    this.getIdsAtPriority(priority).add(assetId);
    this.prioritiesById.set(assetId, priority);
  }

  popNextHighestPriority(): AssetId | undefined {
    const sortedPriorities = iterateNumericEnumKeyedRecord(this.idsByPriority)
      .map(([priority, assetIdSet]) => priority)
      .sort((a, b) => a - b);

    for (const priority of sortedPriorities) {
      const set = this.getIdsAtPriority(priority);
      if (set.size > 0) {
        const next = set.values().next().value;
        invariant(next !== undefined);
        this.remove(next);
        return next;
      }
    }

    return undefined;
  }

  hasEntries() {
    for (const [priority, assetIds] of iterateNumericEnumKeyedRecord(this.idsByPriority)) {
      if (assetIds.size > 0) {
        return true;
      }
    }

    return false;
  }

  isEmpty() {
    return !this.hasEntries();
  }
}

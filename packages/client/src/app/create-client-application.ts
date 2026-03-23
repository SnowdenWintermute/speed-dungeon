import { IndexedDbAssetStore } from "@speed-dungeon/common";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientApplication } from "@/client-application";

export function createClientApplication() {
  const assetCache = new IndexedDbAssetStore(indexedDB);
  const tickScheduler = new ManualTickScheduler();
  return new ClientApplication(assetCache, "http://localhost:8080", tickScheduler.scheduler);
}

import { IndexedDbAssetStore, invariant } from "@speed-dungeon/common";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientApplication } from "@/client-application";

export function createClientApplication() {
  const assetCache = new IndexedDbAssetStore(indexedDB);
  const tickScheduler = new ManualTickScheduler();
  const lobbyServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL;
  invariant(lobbyServerUrl !== undefined, "no lobby server url provided");
  return new ClientApplication(
    assetCache,
    "http://localhost:8080",
    lobbyServerUrl,
    tickScheduler.scheduler
  );
}

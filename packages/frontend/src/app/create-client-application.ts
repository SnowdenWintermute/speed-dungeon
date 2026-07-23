import {
  BrowserWebSocketClientConnectionEndpointFactory,
  CLIENT_LOG_RECORDER_MAX_BYTES,
  IndexedDbAssetStore,
  RemoteServerAssetStore,
  invariant,
} from "@speed-dungeon/common";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientApplication } from "@/client-application";
import { IndexedDbClientLogRecorder } from "@/client-application/client-log-recorder/indexed-db";
import { LocalStorageReconnectionTokenStore } from "@/client-application/reconnection-token-store";

export function createClientApplication() {
  const assetCache = new IndexedDbAssetStore(indexedDB);
  const tickScheduler = new ManualTickScheduler();
  const clientLogRecorder = new IndexedDbClientLogRecorder(
    indexedDB,
    CLIENT_LOG_RECORDER_MAX_BYTES
  );
  const lobbyServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL;
  invariant(lobbyServerUrl !== undefined, "no lobby server url provided");
  const assetServerUrl = process.env.NEXT_PUBLIC_ASSET_SERVER_URL;
  invariant(assetServerUrl !== undefined, "no asset server url provided");
  return new ClientApplication(
    assetCache,
    new RemoteServerAssetStore(assetServerUrl),
    lobbyServerUrl,
    tickScheduler.scheduler,
    clientLogRecorder,
    new BrowserWebSocketClientConnectionEndpointFactory(),
    new LocalStorageReconnectionTokenStore()
  );
}

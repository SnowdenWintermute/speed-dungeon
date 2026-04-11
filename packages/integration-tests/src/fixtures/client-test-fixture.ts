import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import { CLIENT_LOG_RECORDER_MAX_BYTES, IndexedDbAssetStore } from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";
import { GameClient } from "@/client-application/clients/game/index.js";
import { IndexedDbClientLogRecorder } from "@/client-application/client-log-recorder/indexed-db";

export class ClientFixture {
  readonly gameClientHarness: ClientTestHarness<GameClient>;
  readonly lobbyClientHarness: ClientTestHarness<LobbyClient>;
  readonly clientApplication: ClientApplication;

  constructor() {
    const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
    const tickScheduler = new ManualTickScheduler();
    const clientLogRecorder = new IndexedDbClientLogRecorder(
      fakeIndexedDB,
      CLIENT_LOG_RECORDER_MAX_BYTES
    );
    this.clientApplication = new ClientApplication(
      assetCache,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      tickScheduler.scheduler,
      clientLogRecorder
    );

    const { lobbyClientRef, gameClientRef } = this.clientApplication;

    this.lobbyClientHarness = new ClientTestHarness(
      this.clientApplication,
      lobbyClientRef,
      tickScheduler
    );
    this.gameClientHarness = new ClientTestHarness(
      this.clientApplication,
      gameClientRef,
      tickScheduler
    );
  }

  async connect() {
    await this.clientApplication.topologyManager.connectWithPrefferedMode();
  }
}

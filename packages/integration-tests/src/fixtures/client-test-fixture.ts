import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import { TimeMachine } from "@/test-utils/time-machine";
import { IndexedDbAssetStore } from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";
import { GameClient } from "@/client-application/clients/game/index.js";

export class ClientFixture {
  readonly gameClientHarness: ClientTestHarness<GameClient>;
  readonly lobbyClientHarness: ClientTestHarness<LobbyClient>;
  readonly clientApplication: ClientApplication;

  constructor(private timeMachine: TimeMachine) {
    const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
    const tickScheduler = new ManualTickScheduler();
    this.clientApplication = new ClientApplication(
      assetCache,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      tickScheduler.scheduler
    );

    const { lobbyClientRef, gameClientRef } = this.clientApplication;

    this.timeMachine.start();

    this.lobbyClientHarness = new ClientTestHarness(
      this.clientApplication,
      lobbyClientRef,
      tickScheduler,
      this.timeMachine
    );
    this.gameClientHarness = new ClientTestHarness(
      this.clientApplication,
      gameClientRef,
      tickScheduler,
      this.timeMachine
    );
  }

  async connect() {
    await this.clientApplication.topologyManager.connectWithPrefferedMode();
  }
}

import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import { CLIENT_LOG_RECORDER_MAX_BYTES, IndexedDbAssetStore } from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";
import { GameClient } from "@/client-application/clients/game/index.js";
import { IndexedDbClientLogRecorder } from "@/client-application/client-log-recorder/indexed-db";
import { vi } from "vitest";

export class ClientFixture {
  readonly gameClientHarness: ClientTestHarness<GameClient>;
  readonly lobbyClientHarness: ClientTestHarness<LobbyClient>;
  readonly clientApplication: ClientApplication;

  constructor(lobbyServerPort: number) {
    const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
    const tickScheduler = new ManualTickScheduler();
    const clientLogRecorder = new IndexedDbClientLogRecorder(
      fakeIndexedDB,
      CLIENT_LOG_RECORDER_MAX_BYTES
    );
    this.clientApplication = new ClientApplication(
      assetCache,
      `http://localhost:${lobbyServerPort}`,
      `http://localhost:${lobbyServerPort}`,
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

  eventually(assertion: () => void | Promise<void>, options = { timeout: 500, interval: 20 }) {
    return vi.waitFor(async () => {
      await this.clientApplication.sequentialEventProcessor.waitUntilIdle();
      await assertion();
    }, options);
  }
}

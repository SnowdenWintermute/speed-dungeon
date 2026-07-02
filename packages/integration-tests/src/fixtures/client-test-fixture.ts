import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import {
  CLIENT_LOG_RECORDER_MAX_BYTES,
  CombatantClass,
  GameMode,
  GameName,
  IndexedDbAssetStore,
  TestBrowserWebSocketClientConnectionEndpointFactory,
} from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";
import { GameClient } from "@/client-application/clients/game/index.js";
import { IndexedDbClientLogRecorder } from "@/client-application/client-log-recorder/indexed-db";
import { vi } from "vitest";
import { PausableClientRemoteConnectionEndpointFactory } from "@/test-utils/pausable-client-remote-connection-endpoint-factory";
import { InMemoryReconnectionTokenStore } from "@/client-application/reconnection-token-store";
import { TimeMachine } from "@/test-utils/time-machine";
import { TEST_CHARACTER_NAME_1, TEST_GAME_NAME } from "./consts";

export class ClientFixture {
  readonly gameClientHarness: ClientTestHarness<GameClient>;
  readonly lobbyClientHarness: ClientTestHarness<LobbyClient>;
  readonly clientApplication: ClientApplication;
  private clientEndpointFactory: TestBrowserWebSocketClientConnectionEndpointFactory;

  constructor(lobbyServerPort: number, timeMachine: TimeMachine, authSessionId?: string) {
    const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
    const tickScheduler = new ManualTickScheduler();
    const clientLogRecorder = new IndexedDbClientLogRecorder(
      fakeIndexedDB,
      CLIENT_LOG_RECORDER_MAX_BYTES
    );

    this.clientEndpointFactory = new TestBrowserWebSocketClientConnectionEndpointFactory(
      authSessionId
    );

    this.clientApplication = new ClientApplication(
      assetCache,
      `http://localhost:${lobbyServerPort}`,
      `http://localhost:${lobbyServerPort}`,
      tickScheduler.scheduler,
      clientLogRecorder,
      new PausableClientRemoteConnectionEndpointFactory(this.clientEndpointFactory),
      new InMemoryReconnectionTokenStore()
    );

    const { lobbyClientRef, gameClientRef } = this.clientApplication;

    this.lobbyClientHarness = new ClientTestHarness(
      timeMachine,
      this.clientApplication,
      lobbyClientRef,
      tickScheduler
    );
    this.gameClientHarness = new ClientTestHarness(
      timeMachine,
      this.clientApplication,
      gameClientRef,
      tickScheduler
    );
  }

  async connect() {
    await this.clientApplication.topologyManager.connectWithPrefferedMode();
  }

  async startAssetFetch(clearCache: boolean = false) {
    return this.clientApplication.assetService.initialize({
      clearCache,
    });
  }

  async reconnectAsAuth(authId: string) {
    this.clientEndpointFactory.testAuthId = authId;
    if (this.clientApplication.gameClientRef.isInitialized) {
      await this.clientApplication.gameClientRef.get().close();
    }
    await this.clientApplication.lobbyClientRef.get().resetConnection();
  }

  eventually(assertion: () => void | Promise<void>, options = { timeout: 500, interval: 20 }) {
    return vi.waitFor(async () => {
      await assertion();
    }, options);
  }

  requireGameIdFromClientGameList(gameName: GameName) {
    for (const gameListEntry of this.clientApplication.lobbyContext.gameList) {
      if (gameListEntry.gameName === gameName) {
        return gameListEntry.gameId;
      }
    }
    throw new Error("Expected game list entry not found on client application");
  }

  async createSavedIronmanRun() {
    const { lobbyClientHarness, clientApplication } = this;
    await lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
    await lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
    await lobbyClientHarness.toggleReadyToStartGame();
    await clientApplication.sequentialEventProcessor.waitUntilIdle();
    await clientApplication.topologyManager.transitionToGameServer.waitFor();

    clientApplication.gameClientRef.get().leaveGame();
    await clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  }
}

export interface ClientTestFixtureOptions {
  characters?: { name: string; combatantClass: CombatantClass }[];
  gameName?: string;
  proceedToGameServer?: boolean;
}

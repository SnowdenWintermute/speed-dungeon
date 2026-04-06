import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures";
import { createTestServers } from "@/servers/fixtures/create-test-servers";
import { ClientEndpointFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import { TimeMachine } from "@/test-utils/time-machine";
import {
  CharacterCreationPolicyConstructor,
  ClientIntentType,
  CombatantClass,
  DefaultCharacterCreationPolicy,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameServer,
  IncomingConnectionGateway,
  IndexedDbAssetStore,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
} from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { testToCharacterInParty } from "./test-to-character-in-party.js";
import { LobbyClient } from "@/client-application/clients/lobby/index.js";
import { GameClient } from "@/client-application/clients/game/index.js";

export interface EnterTestGameOptions {
  characterCreationPolicyConstructor?: CharacterCreationPolicyConstructor;
  beforeCharacterCreation?: (lobbyServer: LobbyServer) => void;
}

export class IntegrationTestFixture {
  private _lobbyServer: LobbyServer | null = null;
  private _gameServer: GameServer | null = null;
  private _gameClientHarness: ClientTestHarness<GameClient> | null = null;
  private _lobbyClientHarness: ClientTestHarness<LobbyClient> | null = null;
  private _clientApplication: ClientApplication | null = null;
  readonly lobbyIncomingConnectionGateway: IncomingConnectionGateway;
  readonly gameServerIncomingConnectionGateway: IncomingConnectionGateway;

  constructor(
    private clientEndpointFactory: ClientEndpointFactory,
    private timeMachine: TimeMachine
  ) {
    const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
      this.clientEndpointFactory.createIncomingConnectionGateways();
    this.lobbyIncomingConnectionGateway = lobbyIncomingConnectionGateway;
    this.gameServerIncomingConnectionGateway = gameServerIncomingConnectionGateway;
  }

  async createServers(
    rngPolicy: RandomNumberGenerationPolicy,
    dungeonScript: ExplicitCombatantDungeonTemplate,
    characterCreationPolicyConstructor: CharacterCreationPolicyConstructor,
    characterCreationFixture: FixedCharacterCreationLists
  ) {
    const inMemoryTransportAndServers = await createTestServers(
      this.lobbyIncomingConnectionGateway,
      this.gameServerIncomingConnectionGateway,
      rngPolicy,
      characterCreationPolicyConstructor
    );

    this._lobbyServer = inMemoryTransportAndServers.lobbyServer;
    this._lobbyServer.characterCreationPolicy.setCharacters(characterCreationFixture);
    this._gameServer = inMemoryTransportAndServers.gameServer;
    this._gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);
  }

  async createClient() {
    const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
    const tickScheduler = new ManualTickScheduler();
    const clientApplication = new ClientApplication(
      assetCache,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
      tickScheduler.scheduler
    );

    const { lobbyClientRef, gameClientRef } = clientApplication;

    await clientApplication.topologyManager.connectWithPrefferedMode();
    this.timeMachine.start();

    this._lobbyClientHarness = new ClientTestHarness(
      clientApplication,
      lobbyClientRef,
      tickScheduler,
      this.timeMachine
    );
    this._gameClientHarness = new ClientTestHarness(
      clientApplication,
      gameClientRef,
      tickScheduler,
      this.timeMachine
    );
  }
}

export async function enterTestGameSingleCharacter(
  clientEndpointFactory: ClientEndpointFactory,
  timeMachine: TimeMachine,
  gameName: string,
  dungeonScript: ExplicitCombatantDungeonTemplate,
  options: EnterTestGameOptions = {}
) {
  const {
    characterCreationPolicyConstructor = DefaultCharacterCreationPolicy,
    beforeCharacterCreation,
  } = options;
  const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
    clientEndpointFactory.createIncomingConnectionGateways();

  const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
  const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
    counterAttack: fixedRngMinRoll,
    criticalStrike: fixedRngMinRoll,
  });

  const inMemoryTransportAndServers = await createTestServers(
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
    rngPolicy,
    characterCreationPolicyConstructor
  );

  const lobbyServer = inMemoryTransportAndServers.lobbyServer;
  const gameServer = inMemoryTransportAndServers.gameServer;

  gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);

  const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
  const tickScheduler = new ManualTickScheduler();
  const clientApplication = new ClientApplication(
    assetCache,
    `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
    `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
    tickScheduler.scheduler
  );

  const { lobbyClientRef, gameClientRef } = clientApplication;

  await clientApplication.topologyManager.connectWithPrefferedMode();
  timeMachine.start();
  const lobbyClientHarness = new ClientTestHarness(
    clientApplication,
    lobbyClientRef,
    tickScheduler,
    timeMachine
  );
  beforeCharacterCreation?.(lobbyServer);

  await testToCharacterInParty(
    lobbyClientHarness,
    clientApplication,
    CombatantClass.Warrior,
    gameName
  );
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });

  await clientApplication.sequentialEventProcessor.waitUntilIdle();
  await clientApplication.transitionToGameServer.waitFor();

  const gameClientHarness = new ClientTestHarness(
    clientApplication,
    gameClientRef,
    tickScheduler,
    timeMachine
  );

  return {
    lobbyServer,
    gameServer,
    clientApplication,
    gameClientHarness,
    lobbyClientHarness,
    tickScheduler,
  };
}

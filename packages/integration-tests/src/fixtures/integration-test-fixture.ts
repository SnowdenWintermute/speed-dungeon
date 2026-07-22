import {
  BASIC_CHARACTER_FIXTURES,
  CharacterControlScheme,
  CombatantClass,
  DungeonRoomType,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameMode,
  GameName,
  GameServer,
  GameServerName,
  GameServerRegistry,
  GameSessionStoreService,
  GameStateUpdateType,
  IncomingConnectionGateway,
  InMemoryIdentityProviderQueryStrategy,
  invariant,
  iterateNumericEnumKeyedRecord,
  LeastBusyGameServerSelector,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  CharacterLevelLadderService,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  UserGameDataPersistenceService,
  LadderGameRecordsService,
  ResourceChangePropertiesStrategy,
  TestResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { ClientFixture, ClientTestFixtureOptions } from "./client-test-fixture.js";
import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "@speed-dungeon/server";
import { createTestServers } from "./create-test-servers.js";
import { getPortFromAddress } from "@/test-utils/get-port-from-address.js";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_GAME_NAME,
  TEST_PARTY_NAME,
  TestGameServerName,
} from "./consts.js";
import { TimeMachine } from "@/test-utils/time-machine.js";

export type TestGameServersAndPorts = Record<
  TestGameServerName,
  {
    incomingConnectionGateway: IncomingConnectionGateway;
    port: number;
  }
>;

export class IntegrationTestFixture {
  private _lobbyServer: LobbyServer | null = null;
  private _gameServers: Record<TestGameServerName, GameServer> | null = null;
  private _gameServerRegistry: GameServerRegistry | null = null;
  private _gameSessionStoreService: GameSessionStoreService | null = null;
  private clients = new Map<string, ClientFixture>();
  private _lobbyServerPort: number = 0; // will be assigned to some open port by the OS automatically
  private _gameServerPorts: {
    [TestGameServerName.Lindblum]: number;
    [TestGameServerName.Alexandria]: number;
  } = {
    [TestGameServerName.Lindblum]: 0,
    [TestGameServerName.Alexandria]: 0,
  }; // will be assigned to some open port by the OS automatically
  readonly timeMachine = new TimeMachine();
  private _rankedLadderService: CharacterLevelLadderService | null = null;
  private _ladderGameRecordsService: LadderGameRecordsService | null = null;
  private _identityProviderQueryStrategy: InMemoryIdentityProviderQueryStrategy | null = null;
  private _userGameDataPersistenceService: UserGameDataPersistenceService | null = null;
  /** for manipulating which server a new game should be created on in a test */
  private _leastBusyGameServerUrlGetterRef: {
    getter: () => Promise<{ name: GameServerName; url: string }>;
  } = {
    getter: async () => {
      throw new Error("Not initialized");
    },
  };

  private createIncomingConnectionGateways() {
    const lobbyWebSocketServer = new WebSocketServer({ port: 0 });
    const lobbyServerPort = getPortFromAddress(lobbyWebSocketServer);
    const lobbyIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
      lobbyWebSocketServer
    );

    const gameServerGatewaysAndPorts = {
      [TestGameServerName.Lindblum]: this.createIncomingConnectionGateway(),
      [TestGameServerName.Alexandria]: this.createIncomingConnectionGateway(),
    };

    return {
      lobbyIncomingConnectionGateway,
      lobbyServerPort,
      gameServerGatewaysAndPorts,
    };
  }

  private createIncomingConnectionGateway() {
    const webSocketServer = new WebSocketServer({ port: 0 });
    const incomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(webSocketServer);
    const port = getPortFromAddress(webSocketServer);
    return { port, incomingConnectionGateway };
  }

  private async createServers(
    rngPolicy: RandomNumberGenerationPolicy,
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy,
    dungeonScript: ExplicitCombatantDungeonTemplate,
    characterCreationFixture: FixedCharacterCreationLists
  ) {
    const { lobbyIncomingConnectionGateway, lobbyServerPort, gameServerGatewaysAndPorts } =
      this.createIncomingConnectionGateways();

    this._lobbyServerPort = lobbyServerPort;
    for (const [testServerName, { port }] of iterateNumericEnumKeyedRecord(
      gameServerGatewaysAndPorts
    )) {
      this._gameServerPorts[testServerName] = port;
    }

    const {
      lobbyServer,
      gameServers,
      gameServerRegistry,
      gameSessionStoreService,
      rankedLadderService,
      ladderGameRecordsService,
      identityProviderQueryStrategy,
      userGameDataPersistenceService,
    } = await createTestServers(
      lobbyIncomingConnectionGateway,
      gameServerGatewaysAndPorts,
      this._leastBusyGameServerUrlGetterRef,
      rngPolicy,
      resourceChangePropertiesStrategy,
      ScriptedCharacterCreationPolicy
    );

    this._rankedLadderService = rankedLadderService;
    this._ladderGameRecordsService = ladderGameRecordsService;
    this._identityProviderQueryStrategy = identityProviderQueryStrategy;
    this._userGameDataPersistenceService = userGameDataPersistenceService;

    this._gameServerRegistry = gameServerRegistry;
    this._gameSessionStoreService = gameSessionStoreService;

    this._lobbyServer = lobbyServer;
    this._lobbyServer.characterCreationPolicy.setCharacters(characterCreationFixture);

    this._gameServers = gameServers;
    for (const [_, gameServer] of iterateNumericEnumKeyedRecord(this._gameServers)) {
      gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);
    }
  }

  get rankedLadderService() {
    if (!this._rankedLadderService) {
      throw new Error("no rankedLadderService was initialized");
    }
    return this._rankedLadderService;
  }

  get ladderGameRecordsService() {
    if (!this._ladderGameRecordsService) {
      throw new Error("no ladderGameRecordsService was initialized");
    }
    return this._ladderGameRecordsService;
  }

  get identityProviderQueryStrategy() {
    if (!this._identityProviderQueryStrategy) {
      throw new Error("no identityProviderQueryStrategy was initialized");
    }
    return this._identityProviderQueryStrategy;
  }

  get userGameDataPersistenceService() {
    if (!this._userGameDataPersistenceService) {
      throw new Error("no userGameDataPersistenceService was initialized");
    }
    return this._userGameDataPersistenceService;
  }

  get lobbyServer() {
    invariant(this._lobbyServer !== null, "no lobby server initialized");
    return this._lobbyServer;
  }

  get gameServerRegistry() {
    invariant(this._gameServerRegistry !== null, "no game server registry initialized");
    return this._gameServerRegistry;
  }

  get gameSessionStoreService() {
    invariant(this._gameSessionStoreService !== null, "no game session store initialized");
    return this._gameSessionStoreService;
  }

  get lobbyServerPort() {
    return this._lobbyServerPort;
  }

  getGameServerPort(testServerName: TestGameServerName) {
    return this._gameServerPorts[testServerName];
  }

  getGameServer(testServerName: TestGameServerName) {
    invariant(this._gameServers !== null, "no game servers initialized");
    return this._gameServers[testServerName];
  }

  get gameServers() {
    invariant(this._gameServers !== null, "no game servers initialized");
    return this._gameServers;
  }

  setLeastBusyGameServerGetter(value: () => Promise<{ url: string; name: GameServerName }>) {
    this._leastBusyGameServerUrlGetterRef.getter = value;
  }

  /** the fixture defaults to a hardcoded getter so tests can steer placement deliberately.
   * tests of the real selection logic opt back into it with this */
  useRealLeastBusyGameServerSelector() {
    const selector = new LeastBusyGameServerSelector(
      this.gameServerRegistry,
      this.gameSessionStoreService
    );
    this.setLeastBusyGameServerGetter(() => selector.select());
  }

  async closeAllServers() {
    const promises: Promise<void>[] = [];
    for (const [_, gameServer] of iterateNumericEnumKeyedRecord(this.gameServers)) {
      promises.push(gameServer.closeTransportServer());
    }
    promises.push(this.lobbyServer.closeTransportServer());
    await Promise.all(promises);
  }

  createClient(id: string, authSessionId?: string) {
    const client = new ClientFixture(this.lobbyServerPort, this.timeMachine, authSessionId);
    this.clients.set(id, client);
    return client;
  }

  async createConnectedClients<const T extends readonly { id: string; authSessionId?: string }[]>(
    blueprints: T
  ): Promise<{ [K in keyof T]: ClientFixture }> {
    const clients = blueprints.map(({ id, authSessionId }) =>
      this.createClient(id, authSessionId)
    ) as { [K in keyof T]: ClientFixture };

    await Promise.all(clients.map((client) => client.connect()));

    return clients;
  }

  async resetWithOptions(
    dungeonTemplate: ExplicitCombatantDungeonTemplate = TEST_DUNGEON_TWO_WOLF_ROOMS,
    charactersTemplate: FixedCharacterCreationLists = BASIC_CHARACTER_FIXTURES,
    rngOverrides: Partial<RandomNumberGenerationPolicy> = {},
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy = new TestResourceChangePropertiesStrategy(),
    // servers register their heartbeat intervals as they are constructed, so tests that need
    // to drive those intervals must have fake timers installed before the servers exist
    options: { useFakeTimersFromBoot: boolean } = { useFakeTimersFromBoot: false }
  ) {
    this.timeMachine.returnToPresent();

    if (options.useFakeTimersFromBoot) {
      this.timeMachine.start();
    }

    const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
    const basicOverrides = {
      counterAttack: fixedRngMinRoll,
      criticalStrike: fixedRngMinRoll,
      parry: fixedRngMinRoll,
      shieldBlock: fixedRngMinRoll,
      spellResist: fixedRngMinRoll,
    };
    const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
      ...basicOverrides,
      ...rngOverrides,
    });
    await this.createServers(
      rngPolicy,
      resourceChangePropertiesStrategy,
      dungeonTemplate,
      charactersTemplate
    );
  }

  async createSingleClientInStartedGame(
    playerCharacterClasses: { name: string; combatantClass: CombatantClass }[] = [
      { name: "a", combatantClass: CombatantClass.Warrior },
      { name: "b", combatantClass: CombatantClass.Rogue },
    ]
  ) {
    const client = this.createClient("client 1");
    await client.connect();

    await client.lobbyClientHarness.createGame("test-game-a" as GameName);
    await client.lobbyClientHarness.createParty("test-party-a");
    for (const { name, combatantClass } of playerCharacterClasses) {
      await client.lobbyClientHarness.createCharacter(name, combatantClass);
    }
    await client.lobbyClientHarness.toggleReadyToStartGame();
    const { clientApplication } = client;
    await clientApplication.sequentialEventProcessor.waitUntilIdle();
    await clientApplication.topologyManager.transitionToGameServer.waitFor();

    return client;
  }

  async createSingleClientWithSavedCharacters(
    testClientId: string,
    authId: string,
    options?: ClientTestFixtureOptions
  ) {
    const client = this.createClient(testClientId, authId);
    await client.connect();
    if (options?.characters) {
      if (options.characters.length < 1) {
        throw new Error("Should at least specify one character");
      }
      for (const { name, combatantClass } of options.characters) {
        await client.lobbyClientHarness.createSavedCharacter(
          name,
          combatantClass,
          CharacterControlScheme.Captain
        );
      }
    } else {
      await client.lobbyClientHarness.createSavedCharacter(
        TEST_CHARACTER_NAME_1,
        CombatantClass.Warrior,
        CharacterControlScheme.Captain
      );
    }
    return client;
  }

  async createSingleClientInProgressionGame(
    testClientId: string,
    authId: string,
    options?: ClientTestFixtureOptions
  ) {
    const client = await this.createSingleClientWithSavedCharacters(testClientId, authId, options);
    const gameName = options?.gameName ? options.gameName : TEST_GAME_NAME;
    await client.lobbyClientHarness.createGame(
      gameName as GameName,
      GameMode.Progression,
      CharacterControlScheme.Captain
    );
    if (options?.proceedToGameServer) {
      await client.lobbyClientHarness.toggleReadyToStartGame();
      await client.clientApplication.topologyManager.transitionToGameServer.waitFor();
    }
    return client;
  }

  async createTwoClientsInLobbyProgressionGame(
    alphaOptions: undefined | ClientTestFixtureOptions,
    bravoOptions: undefined | ClientTestFixtureOptions
  ) {
    const alpha = await this.createSingleClientInProgressionGame(
      "client 1",
      TEST_AUTH_SESSION_ID_PLAYER_1,
      alphaOptions
    );
    const bravo = await this.createSingleClientWithSavedCharacters(
      "client 2",
      TEST_AUTH_SESSION_ID_PLAYER_2,
      bravoOptions
    );

    await bravo.lobbyClientHarness.fetchGameList();
    await bravo.lobbyClientHarness.joinGame(bravo.requireGameIdFromClientGameList(TEST_GAME_NAME));
    await alpha.lobbyClientHarness.awaitMessageOfType(GameStateUpdateType.CharacterAddedToParty);
    return { alpha, bravo };
  }

  async createTwoClientsInLobbyGame(options?: { auth?: boolean }) {
    let alphaAuthId = "";
    let bravoAuthId = "";
    if (options?.auth) {
      alphaAuthId = TEST_AUTH_SESSION_ID_PLAYER_1;
      bravoAuthId = TEST_AUTH_SESSION_ID_PLAYER_2;
    }
    const alpha = this.createClient("client a", alphaAuthId);
    const bravo = this.createClient("client b", bravoAuthId);
    await Promise.all([alpha.connect(), bravo.connect()]);

    await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME);
    await alpha.lobbyClientHarness.createParty(TEST_PARTY_NAME);
    await alpha.lobbyClientHarness.createCharacter("a", CombatantClass.Rogue);

    await bravo.lobbyClientHarness.fetchGameList();
    await bravo.lobbyClientHarness.joinGame(bravo.requireGameIdFromClientGameList(TEST_GAME_NAME));
    await bravo.lobbyClientHarness.joinParty(TEST_PARTY_NAME);
    await bravo.lobbyClientHarness.createCharacter("b", CombatantClass.Warrior);

    return { alpha, bravo };
  }

  async createTwoClientsInGameServerGame(options?: { auth?: boolean }) {
    const { alpha, bravo } = await this.createTwoClientsInLobbyGame(options);
    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    await bravo.lobbyClientHarness.toggleReadyToStartGame();

    await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
    await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
    await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
    await bravo.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
    return { alpha, bravo };
  }

  async createTwoClientsInFirstMonsterLair(options?: { auth?: boolean }) {
    const { alpha, bravo } = await this.createTwoClientsInGameServerGame(options);

    const partyA = alpha.gameClientHarness.clientApplication.gameContext.requireParty();
    const partyB = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
    expect(partyA.currentRoom.requireType(DungeonRoomType.Empty));
    expect(partyB.currentRoom.requireType(DungeonRoomType.Empty));
    await alpha.gameClientHarness.toggleReadyToExplore();
    await bravo.gameClientHarness.toggleReadyToExplore();
    expect(partyA.currentRoom.requireType(DungeonRoomType.MonsterLair));
    expect(partyB.currentRoom.requireType(DungeonRoomType.MonsterLair));
    return { alpha, bravo };
  }

  async putTwoClientsInFreshIronmanRun(
    alpha: ClientFixture,
    bravo: ClientFixture,
    options?: { closeGame?: boolean; controlScheme?: CharacterControlScheme }
  ) {
    // create a run that another user is a participant of
    let controlScheme = CharacterControlScheme.Captain;
    if (options?.controlScheme !== undefined) {
      controlScheme = options.controlScheme;
    }

    await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman, controlScheme);
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
    await bravo.lobbyClientHarness.tryJoinExpectedSingleGameInList();
    await bravo.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);

    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    await bravo.lobbyClientHarness.toggleReadyToStartGame();
    await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
    await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
    await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
    await bravo.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();

    // one player closing the game closes for all
    if (options?.closeGame) {
      await alpha.clientApplication.gameClientRef.get().leaveGame();
      const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
        GameStateUpdateType.GameClosed
      );
      await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
      // bravo should be disconnected when other player leaves ironman game
      await bravoDisconnectedOnAlphaLeavePromise;
      await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
    }
  }
}

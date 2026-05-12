import {
  BASIC_CHARACTER_FIXTURES,
  CombatantClass,
  DungeonRoomType,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameMode,
  GameServer,
  GameServerName,
  GameStateUpdateType,
  IncomingConnectionGateway,
  invariant,
  iterateNumericEnumKeyedRecord,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  RankedLadderService,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";
import { ClientFixture, ClientTestFixtureOptions } from "./client-test-fixture.js";
import { SpeciesAnimationLengths } from "@speed-dungeon/common/src/servers/game-server/asset-analyzer/index.js";
import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "@speed-dungeon/server";
import { createTestServers } from "./create-test-servers.js";
import { getPortFromAddress } from "@/test-utils/get-port-from-address.js";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_CHARACTER_NAME_1,
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
  private clients = new Map<string, ClientFixture>();
  private previouslyCalculatedAnimationLengths: SpeciesAnimationLengths | undefined;
  private _lobbyServerPort: number = 0; // will be assigned to some open port by the OS automatically
  private _gameServerPorts: {
    [TestGameServerName.Lindblum]: number;
    [TestGameServerName.Alexandria]: number;
  } = {
    [TestGameServerName.Lindblum]: 0,
    [TestGameServerName.Alexandria]: 0,
  }; // will be assigned to some open port by the OS automatically
  readonly timeMachine = new TimeMachine();
  private _rankedLadderService: RankedLadderService | null = null;
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

    if (this._gameServers !== null) {
      this.previouslyCalculatedAnimationLengths =
        this._gameServers[TestGameServerName.Lindblum].assetAnalyzer.animationLengths;
    }

    const servers = await createTestServers(
      lobbyIncomingConnectionGateway,
      gameServerGatewaysAndPorts,
      this._leastBusyGameServerUrlGetterRef,
      rngPolicy,
      ScriptedCharacterCreationPolicy
    );

    this._rankedLadderService = servers.rankedLadderService;

    this._lobbyServer = servers.lobbyServer;
    this._lobbyServer.characterCreationPolicy.setCharacters(characterCreationFixture);

    this._gameServers = servers.gameServers;
    for (const [_, gameServer] of iterateNumericEnumKeyedRecord(this._gameServers)) {
      gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);
    }

    if (!this.previouslyCalculatedAnimationLengths) {
      await this._gameServers[TestGameServerName.Lindblum].analyzeAssetsForGameplayRelevantData();
    } else {
      for (const [_, gameServer] of iterateNumericEnumKeyedRecord(this._gameServers)) {
        gameServer.assetAnalyzer.animationLengths = this.previouslyCalculatedAnimationLengths;
      }
    }
  }

  get rankedLadderService() {
    if (!this._rankedLadderService) {
      throw new Error("no rankedLadderService was initialized");
    }
    return this._rankedLadderService;
  }

  get lobbyServer() {
    invariant(this._lobbyServer !== null, "no lobby server initialized");
    return this._lobbyServer;
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

  async closeAllServers() {
    const promises: Promise<void>[] = [];
    for (const [_, gameServer] of iterateNumericEnumKeyedRecord(this.gameServers)) {
      promises.push(gameServer.closeTransportServer());
    }
    promises.push(this.lobbyServer.closeTransportServer());
    await Promise.all(promises);
  }

  createClient(id: string, authId?: string) {
    const client = new ClientFixture(this.lobbyServerPort, this.timeMachine, authId);
    this.clients.set(id, client);
    return client;
  }

  async resetWithOptions(
    dungeonTemplate: ExplicitCombatantDungeonTemplate = TEST_DUNGEON_TWO_WOLF_ROOMS,
    charactersTemplate: FixedCharacterCreationLists = BASIC_CHARACTER_FIXTURES,
    rngOverrides: Partial<RandomNumberGenerationPolicy> = {}
  ) {
    this.timeMachine.returnToPresent();

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
    await this.createServers(rngPolicy, dungeonTemplate, charactersTemplate);
  }

  async createSingleClientInStartedGame(
    playerCharacterClasses: { name: string; combatantClass: CombatantClass }[] = [
      { name: "a", combatantClass: CombatantClass.Warrior },
      { name: "b", combatantClass: CombatantClass.Rogue },
    ]
  ) {
    const client = this.createClient("client 1");
    await client.connect();

    await client.lobbyClientHarness.createGame("test-game-a");
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
      for (const { name, combatantClass, slotIndex } of options.characters) {
        await client.lobbyClientHarness.createSavedCharacter(name, combatantClass, slotIndex);
      }
    } else {
      await client.lobbyClientHarness.createSavedCharacter(
        TEST_CHARACTER_NAME_1,
        CombatantClass.Warrior,
        0
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
    await client.lobbyClientHarness.createGame(gameName, GameMode.Progression);
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
    await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
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

    await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
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
}

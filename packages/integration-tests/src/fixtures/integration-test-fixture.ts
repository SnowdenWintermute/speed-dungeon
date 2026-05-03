import {
  BASIC_CHARACTER_FIXTURES,
  CombatantClass,
  DungeonRoomType,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameMode,
  GameServer,
  GameStateUpdateType,
  invariant,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  RankedLadderService,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";
import { ClientFixture, ClientTestFixtureSavedCharacterOptions } from "./client-test-fixture.js";
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
} from "./consts.js";
import { TimeMachine } from "@/test-utils/time-machine.js";

export class IntegrationTestFixture {
  private _lobbyServer: LobbyServer | null = null;
  private _gameServer: GameServer | null = null;
  private clients = new Map<string, ClientFixture>();
  private previouslyCalculatedAnimationLengths: SpeciesAnimationLengths | undefined;
  private _lobbyServerPort: number = 0; // will be assigned to some open port by the OS automatically
  private _gameServerPort: number = 0; // will be assigned to some open port by the OS automatically
  readonly timeMachine = new TimeMachine();
  private _rankedLadderService: RankedLadderService;

  private createIncomingConnectionGateways() {
    const lobbyWebSocketServer = new WebSocketServer({ port: 0 });
    const lobbyServerPort = getPortFromAddress(lobbyWebSocketServer);

    const lobbyIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
      lobbyWebSocketServer
    );
    const gameServerWebSocketServer = new WebSocketServer({ port: 0 });
    const gameServerIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
      gameServerWebSocketServer
    );
    const gameServerPort = getPortFromAddress(gameServerWebSocketServer);

    return {
      lobbyIncomingConnectionGateway,
      gameServerIncomingConnectionGateway,
      lobbyServerPort,
      gameServerPort,
    };
  }

  private async createServers(
    rngPolicy: RandomNumberGenerationPolicy,
    dungeonScript: ExplicitCombatantDungeonTemplate,
    characterCreationFixture: FixedCharacterCreationLists
  ) {
    const {
      lobbyIncomingConnectionGateway,
      gameServerIncomingConnectionGateway,
      lobbyServerPort,
      gameServerPort,
    } = this.createIncomingConnectionGateways();
    this._lobbyServerPort = lobbyServerPort;
    this._gameServerPort = gameServerPort;

    if (this._gameServer !== null) {
      this.previouslyCalculatedAnimationLengths = this._gameServer.assetAnalyzer.animationLengths;
    }

    const servers = await createTestServers(
      lobbyIncomingConnectionGateway,
      gameServerIncomingConnectionGateway,
      gameServerPort,
      rngPolicy,
      ScriptedCharacterCreationPolicy
    );

    this._rankedLadderService = servers.rankedLadderService;

    this._lobbyServer = servers.lobbyServer;
    this._lobbyServer.characterCreationPolicy.setCharacters(characterCreationFixture);
    this._gameServer = servers.gameServer;
    this._gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);

    if (!this.previouslyCalculatedAnimationLengths) {
      await this._gameServer.analyzeAssetsForGameplayRelevantData();
    } else {
      this._gameServer.assetAnalyzer.animationLengths = this.previouslyCalculatedAnimationLengths;
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
  get gameServerPort() {
    return this._gameServerPort;
  }

  get gameServer() {
    invariant(this._gameServer !== null, "no game server initialized");
    return this._gameServer;
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
    await clientApplication.transitionToGameServer.waitFor();

    return client;
  }

  async createSingleClientWithSavedCharacters(
    testClientId: string,
    authId: string,
    options?: ClientTestFixtureSavedCharacterOptions
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

  async createSingleClientInLobbyProgressionGame(
    testClientId: string,
    authId: string,
    options?: ClientTestFixtureSavedCharacterOptions
  ) {
    const client = await this.createSingleClientWithSavedCharacters(testClientId, authId, options);
    await client.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
    return client;
  }

  async createTwoClientsInLobbyProgressionGame(
    alphaOptions: undefined | ClientTestFixtureSavedCharacterOptions,
    bravoOptions: undefined | ClientTestFixtureSavedCharacterOptions
  ) {
    const alpha = await this.createSingleClientInLobbyProgressionGame(
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

    await alpha.clientApplication.transitionToGameServer.waitFor();
    await bravo.clientApplication.transitionToGameServer.waitFor();
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

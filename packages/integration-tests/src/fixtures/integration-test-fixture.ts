import {
  CombatantClass,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameServer,
  invariant,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
} from "@speed-dungeon/common";
import { ClientFixture } from "./client-test-fixture.js";
import { SpeciesAnimationLengths } from "@speed-dungeon/common/src/servers/game-server/asset-analyzer/index.js";
import { WebSocketServer } from "ws";
import { getPortFromAddress } from "@/servers/fixtures/create-test-websocket-incoming-connection-gateways.js";
import { NodeWebSocketIncomingConnectionGateway } from "@speed-dungeon/server";
import { createTestServers } from "./create-test-servers.js";

export class IntegrationTestFixture {
  private _lobbyServer: LobbyServer | null = null;
  private _gameServer: GameServer | null = null;
  private clients = new Map<string, ClientFixture>();
  private previouslyCalculatedAnimationLengths: SpeciesAnimationLengths | undefined;
  private _lobbyServerPort: number = 0; // will be assigned to some open port by the OS automatically

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

  get lobbyServer() {
    invariant(this._lobbyServer !== null, "no lobby server initialized");
    return this._lobbyServer;
  }

  get lobbyServerPort() {
    return this._lobbyServerPort;
  }

  get gameServer() {
    invariant(this._gameServer !== null, "no game server initialized");
    return this._gameServer;
  }

  createClient(id: string) {
    const client = new ClientFixture(this.lobbyServerPort);
    this.clients.set(id, client);
    return client;
  }

  async resetWithOptions(
    dungeonTemplate: ExplicitCombatantDungeonTemplate,
    charactersTemplate: FixedCharacterCreationLists,
    rngOverrides: Partial<RandomNumberGenerationPolicy> = {}
  ) {
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
}

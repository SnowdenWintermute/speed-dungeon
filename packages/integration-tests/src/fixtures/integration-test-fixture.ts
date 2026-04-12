import { createTestServers } from "@/servers/fixtures/create-test-servers";
import { ClientEndpointFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatantClass,
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  FixedNumberGenerator,
  GameServer,
  IncomingConnectionGateway,
  invariant,
  LobbyServer,
  RandomNumberGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  ScriptedCharacterCreationPolicy,
} from "@speed-dungeon/common";
import { ClientFixture } from "./client-test-fixture.js";

export class IntegrationTestFixture {
  private _lobbyServer: LobbyServer | null = null;
  private _gameServer: GameServer | null = null;
  private clients = new Map<string, ClientFixture>();

  constructor(private clientEndpointFactory: ClientEndpointFactory) {}

  async createServers(
    rngPolicy: RandomNumberGenerationPolicy,
    dungeonScript: ExplicitCombatantDungeonTemplate,
    characterCreationFixture: FixedCharacterCreationLists
  ) {
    const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
      this.clientEndpointFactory.createIncomingConnectionGateways();
    const inMemoryTransportAndServers = await createTestServers(
      lobbyIncomingConnectionGateway,
      gameServerIncomingConnectionGateway,
      rngPolicy,
      ScriptedCharacterCreationPolicy
    );

    this._lobbyServer = inMemoryTransportAndServers.lobbyServer;
    this._lobbyServer.characterCreationPolicy.setCharacters(characterCreationFixture);
    this._gameServer = inMemoryTransportAndServers.gameServer;
    this._gameServer.dungeonGenerationPolicy.setExplicitFloors(dungeonScript);
  }

  get lobbyServer() {
    invariant(this._lobbyServer !== null, "no lobby server initialized");
    return this._lobbyServer;
  }

  get gameServer() {
    invariant(this._gameServer !== null, "no game server initialized");
    return this._gameServer;
  }

  createClient(id: string) {
    const client = new ClientFixture();
    this.clients.set(id, client);
    return client;
  }

  requireClient(id: string) {
    const option = this.clients.get(id);
    invariant(option !== undefined, "no client fixture found");
    return option;
  }

  async resetWithOptions(
    dungeonTemplate: ExplicitCombatantDungeonTemplate,
    charactersTemplate: FixedCharacterCreationLists,
    playerCharacterClasses: { name: string; combatantClass: CombatantClass }[] = [
      { name: "a", combatantClass: CombatantClass.Warrior },
      { name: "b", combatantClass: CombatantClass.Rogue },
    ],
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
    this.createServers(rngPolicy, dungeonTemplate, charactersTemplate);

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

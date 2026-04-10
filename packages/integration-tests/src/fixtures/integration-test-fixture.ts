import { createTestServers } from "@/servers/fixtures/create-test-servers";
import { ClientEndpointFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import {
  ExplicitCombatantDungeonTemplate,
  FixedCharacterCreationLists,
  GameServer,
  IncomingConnectionGateway,
  invariant,
  LobbyServer,
  RandomNumberGenerationPolicy,
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
}

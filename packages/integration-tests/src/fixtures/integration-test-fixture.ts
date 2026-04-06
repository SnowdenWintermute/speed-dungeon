import { createTestServers } from "@/servers/fixtures/create-test-servers";
import { ClientEndpointFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import { TimeMachine } from "@/test-utils/time-machine";
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
  readonly lobbyIncomingConnectionGateway: IncomingConnectionGateway;
  readonly gameServerIncomingConnectionGateway: IncomingConnectionGateway;
  private clients = new Map<string, ClientFixture>();

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
    characterCreationFixture: FixedCharacterCreationLists
  ) {
    const inMemoryTransportAndServers = await createTestServers(
      this.lobbyIncomingConnectionGateway,
      this.gameServerIncomingConnectionGateway,
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
    const client = new ClientFixture(this.timeMachine);
    this.clients.set(id, client);
    return client;
  }

  requireClient(id: string) {
    const option = this.clients.get(id);
    invariant(option !== undefined, "no client fixture found");
    return option;
  }
}

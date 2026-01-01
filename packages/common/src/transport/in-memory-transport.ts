import { ConnectionId } from "../aliases.js";
import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LocalConnectionEndpointManager } from "./local-connection-endpoint-manager.js";
import {
  LocalConnectionEndpoint,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
} from "./connection-endpoint.js";

export class InMemoryTransport {
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly serverConnectionEndpointManager = new LocalConnectionEndpointManager<
    GameStateUpdate,
    ClientIntent
  >();

  private readonly clientConnectionEndpointManager = new LocalConnectionEndpointManager<
    ClientIntent,
    GameStateUpdate
  >();

  async createConnection() {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new LocalConnectionEndpoint<GameStateUpdate, ClientIntent>(
      id,
      (update) => clientEndpoint.receive(update),
      () =>
        this.serverConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    const clientEndpoint = new LocalConnectionEndpoint<ClientIntent, GameStateUpdate>(
      id,
      (intent) => serverEndpoint.receive(intent),
      () =>
        this.clientConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    await this.serverConnectionEndpointManager.onNewConnection(serverEndpoint);

    return { serverEndpoint, clientEndpoint };
  }

  getServerConnectionEndpointManager() {
    return this.serverConnectionEndpointManager;
  }

  getClientConnectionEndpointManager() {
    return this.clientConnectionEndpointManager;
  }
}

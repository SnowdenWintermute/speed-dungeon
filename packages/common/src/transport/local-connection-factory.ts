import { ConnectionId } from "../aliases.js";
import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LocalConnectionEndpointManager } from "./local-connection-endpoint-manager.js";
import {
  LocalTransportEndpoint,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
} from "./transport-endpoint.js";

export class LocalConnectionFactory {
  private idGenerator = new IdGenerator({ saveHistory: false });
  private serverConnectionEndpointManager = new LocalConnectionEndpointManager<
    GameStateUpdate,
    ClientIntent
  >();

  private clientConnectionEndpointManager = new LocalConnectionEndpointManager<
    ClientIntent,
    GameStateUpdate
  >();

  async create() {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new LocalTransportEndpoint<GameStateUpdate, ClientIntent>(
      id,
      (update) => clientEndpoint.receive(update),
      () =>
        this.serverConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    const clientEndpoint = new LocalTransportEndpoint<ClientIntent, GameStateUpdate>(
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
}

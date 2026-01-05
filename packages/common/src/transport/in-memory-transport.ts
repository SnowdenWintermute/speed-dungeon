import { ConnectionId } from "../aliases.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LocalConnectionEndpointManager } from "./local-connection-endpoint-manager.js";
import {
  LocalConnectionEndpoint,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
} from "./connection-endpoint.js";

export class InMemoryTransport<
  ClientMessage extends { type: PropertyKey; data: unknown },
  ServerMessage extends { type: PropertyKey; data: unknown },
> {
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly serverConnectionEndpointManager = new LocalConnectionEndpointManager<
    ServerMessage,
    ClientMessage
  >();

  private readonly clientConnectionEndpointManager = new LocalConnectionEndpointManager<
    ClientMessage,
    ServerMessage
  >();

  async createConnection() {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new LocalConnectionEndpoint<ServerMessage, ClientMessage>(
      id,
      (update) => clientEndpoint.receive(update),
      () =>
        this.serverConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    const clientEndpoint = new LocalConnectionEndpoint<ClientMessage, ServerMessage>(
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

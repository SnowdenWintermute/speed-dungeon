import { ConnectionId } from "../aliases.js";
import { ConnectionIdentityResolutionContext } from "../servers/services/identity-provider.js";
import { TransportDisconnectReason } from "./disconnect-reasons.js";
import { UntypedInMemoryConnectionEndpoint } from "./in-memory-connection-endpoint.js";

export class InMemoryConnectionEndpointManager {
  private connections = new Map<ConnectionId, UntypedInMemoryConnectionEndpoint>();
  private handleNewConnection: (
    transportEndpoint: UntypedInMemoryConnectionEndpoint,
    identityContext: ConnectionIdentityResolutionContext
  ) => Promise<void> = () => {
    throw new Error("not initialized");
  };

  // equivalent to socket.io server's io.on("connection", (newSocketObject) => {
  // // register socket event listeners on the new object
  // })
  setNewConnectionHandler(
    handler: (
      transportEndpoint: UntypedInMemoryConnectionEndpoint,
      identityContext: ConnectionIdentityResolutionContext
    ) => Promise<void>
  ) {
    this.handleNewConnection = handler;
  }

  // equivalent to firing a socket.io connection event
  async onNewConnection(
    transportEndpoint: UntypedInMemoryConnectionEndpoint,
    identityContext: ConnectionIdentityResolutionContext
  ): Promise<void> {
    this.connections.set(transportEndpoint.id, transportEndpoint);
    await this.handleNewConnection(transportEndpoint, identityContext);
  }

  disconnect(id: ConnectionId, reason: TransportDisconnectReason) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
    }
  }
}

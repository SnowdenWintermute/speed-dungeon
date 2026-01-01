import { ConnectionId } from "../aliases.js";
import { LocalConnectionEndpoint, TransportDisconnectReason } from "./connection-endpoint.js";

export class LocalConnectionEndpointManager<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> {
  private connections = new Map<ConnectionId, LocalConnectionEndpoint<Sendable, Receivable>>();
  private handleNewConnection: (
    transportEndpoint: LocalConnectionEndpoint<Sendable, Receivable>
  ) => Promise<void> = () => {
    throw new Error("not initialized");
  };

  // equivalent to socket.io server's io.on("connection", (newSocketObject) => {
  // // register socket event listeners on the new object
  // })
  setNewConnectionHandler(
    handler: (transportEndpoint: LocalConnectionEndpoint<Sendable, Receivable>) => Promise<void>
  ) {
    this.handleNewConnection = handler;
  }

  // equivalent to firing a socket.io connection event
  async onNewConnection(
    transportEndpoint: LocalConnectionEndpoint<Sendable, Receivable>
  ): Promise<void> {
    this.connections.set(transportEndpoint.id, transportEndpoint);
    await this.handleNewConnection(transportEndpoint);
  }

  disconnect(id: ConnectionId, reason: TransportDisconnectReason) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
    }
  }
}

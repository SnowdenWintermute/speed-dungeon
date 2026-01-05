import { ConnectionId } from "../../aliases.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";

export class OutgoingMessageGateway<Sendable, Receivable> {
  // socket.io socket objects or local client transport endpoints
  private transportEndpoints = new Map<ConnectionId, ConnectionEndpoint<Sendable, Receivable>>();
  registerEndpoint(
    connectionId: ConnectionId,
    endpoint: ConnectionEndpoint<Sendable, Receivable>
  ): void {
    this.transportEndpoints.set(connectionId, endpoint);
  }

  unregisterEndpoint(connectionId: ConnectionId): void {
    this.transportEndpoints.delete(connectionId);
  }

  submitToConnection(connectionId: ConnectionId, message: Sendable): void {
    const endpoint = this.transportEndpoints.get(connectionId);
    if (!endpoint) {
      throw new Error("expected connection id had no associated ConnectionEndpoint");
    }
    endpoint.send(message);
  }

  submitToConnections(connectionIds: ConnectionId[], message: Sendable): void {
    for (const id of connectionIds) {
      this.submitToConnection(id, message);
    }
  }
}

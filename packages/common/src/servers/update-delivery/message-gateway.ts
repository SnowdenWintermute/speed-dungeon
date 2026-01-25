import { ConnectionId } from "../../aliases.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";

export class OutgoingMessageGateway<Sendable> {
  // socket.io socket objects or local client transport endpoints
  private transportEndpoints = new Map<ConnectionId, ConnectionEndpoint>();
  registerEndpoint(id: ConnectionId, endpoint: ConnectionEndpoint): void {
    this.transportEndpoints.set(id, endpoint);
  }

  unregisterEndpoint(connectionId: ConnectionId): void {
    this.transportEndpoints.delete(connectionId);
  }

  submitToConnection(connectionId: ConnectionId, message: Sendable): void {
    const endpoint = this.transportEndpoints.get(connectionId);
    if (!endpoint) {
      throw new Error(
        `expected connection id ${connectionId} had no associated ConnectionEndpoint`
      );
    }

    const serializedMessage = JSON.stringify(message);
    endpoint.send(serializedMessage);
  }

  submitToConnections(connectionIds: ConnectionId[], message: Sendable): void {
    for (const id of connectionIds) {
      this.submitToConnection(id, message);
    }
  }
}

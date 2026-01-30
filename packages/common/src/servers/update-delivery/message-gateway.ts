import { ConnectionId } from "../../aliases.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";

export class OutgoingMessageGateway<Sendable> {
  private transportEndpoints = new Map<ConnectionId, ConnectionEndpoint>();

  registerEndpoint(endpoint: ConnectionEndpoint): void {
    this.transportEndpoints.set(endpoint.id, endpoint);
  }

  unregisterEndpoint(connectionId: ConnectionId): void {
    this.transportEndpoints.delete(connectionId);
  }

  submitToConnection(connectionId: ConnectionId, message: Sendable): void {
    const endpoint = this.transportEndpoints.get(connectionId);
    if (!endpoint) {
      // it is possible for this sequence:
      // - we add a message to an outbox in an async function
      // - the session disconnects and we remove them
      // - the original async function finishes
      // - we try to send the message to a session no longer existing
      return;
      // throw new Error(
      //   `expected connection id ${connectionId} had no associated ConnectionEndpoint, message: ${JSON.stringify(message)}`
      // );
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

import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionId } from "../primatives/index.js";
import { TransportEndpoint } from "./transport-endpoint.js";

export class GameStateUpdateGateway {
  // socket.io socket objects or local client transport endpoints
  private transportEndpoints: Map<ConnectionId, TransportEndpoint> = new Map();
  registerEndpoint(connectionId: ConnectionId, endpoint: TransportEndpoint): void {
    this.transportEndpoints.set(connectionId, endpoint);
  }

  unregisterEndpoint(connectionId: ConnectionId): void {
    this.transportEndpoints.delete(connectionId);
  }

  submitToConnection(connectionId: ConnectionId, update: GameStateUpdate): void {
    const endpoint = this.transportEndpoints.get(connectionId);
    if (!endpoint) {
      throw new Error("expected connection id had no associated TransportEndpoint");
    }
    endpoint.send(update);
  }

  submitToConnections(connectionIds: Iterable<ConnectionId>, update: GameStateUpdate): void {
    for (const id of connectionIds) {
      this.submitToConnection(id, update);
    }
  }
}

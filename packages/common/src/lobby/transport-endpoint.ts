import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionId } from "../types.js";

export interface TransportEndpoint {
  readonly id: ConnectionId;
  send(update: GameStateUpdate): void;
  close?(): void;
}

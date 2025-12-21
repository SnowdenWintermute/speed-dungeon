import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionId } from "../primatives/index.js";

export interface TransportEndpoint {
  readonly id: ConnectionId;
  send(update: GameStateUpdate): void;
  close?(): void;
}

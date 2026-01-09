import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export interface GameSessionStoreService {
  writePendingGameSetup(gameId: string, setup: PendingGameSetup): Promise<void>;
  getPendingGameSetup(gameId: string): Promise<PendingGameSetup | null>;
  deletePendingGameSetup(gameId: string): Promise<void>;

  writeActiveGame(gameId: string, game: ActiveGameStatus): Promise<void>;
  getActiveGame(gameId: string): Promise<ActiveGameStatus | null>;

  writeDisconnectedUser(userId: string, record: DisconnectedSession): Promise<void>;
  getDisconnectedUser(userId: string): Promise<DisconnectedSession | null>;
  deleteDisconnectedUser(userId: string): Promise<void>;
}

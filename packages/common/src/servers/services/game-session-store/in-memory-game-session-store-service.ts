import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  writePendingGameSetup(gameId: string, setup: PendingGameSetup): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPendingGameSetup(gameId: string): Promise<PendingGameSetup | null> {
    throw new Error("Method not implemented.");
  }
  deletePendingGameSetup(gameId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  writeActiveGame(gameId: string, game: ActiveGameStatus): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveGame(gameId: string): Promise<ActiveGameStatus | null> {
    throw new Error("Method not implemented.");
  }
  writeDisconnectedUser(userId: string, record: DisconnectedSession): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getDisconnectedUser(userId: string): Promise<DisconnectedSession | null> {
    throw new Error("Method not implemented.");
  }
  deleteDisconnectedUser(userId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

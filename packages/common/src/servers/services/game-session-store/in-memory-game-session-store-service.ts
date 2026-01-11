import { GameId } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  writeActiveGameStatus(gameId: GameId, game: ActiveGameStatus): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveGameStatus(gameId: GameId): Promise<ActiveGameStatus | null> {
    throw new Error("Method not implemented.");
  }
  writePendingGameSetup(gameId: GameId, setup: PendingGameSetup): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPendingGameSetup(gameId: GameId): Promise<PendingGameSetup | null> {
    throw new Error("Method not implemented.");
  }
  deletePendingGameSetup(gameId: GameId): Promise<void> {
    throw new Error("Method not implemented.");
  }
  writeActiveGame(gameId: GameId, game: ActiveGameStatus): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveGame(gameId: GameId): Promise<ActiveGameStatus | null> {
    throw new Error("Method not implemented.");
  }
  writeDisconnectedUser(userId: UserId, record: DisconnectedSession): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getDisconnectedUser(userId: UserId): Promise<DisconnectedSession | null> {
    throw new Error("Method not implemented.");
  }
  deleteDisconnectedUser(userId: UserId): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

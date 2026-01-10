import { GameId } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export interface GameSessionStoreService {
  writePendingGameSetup(gameId: GameId, setup: PendingGameSetup): Promise<void>;
  getPendingGameSetup(gameId: GameId): Promise<PendingGameSetup | null>;
  deletePendingGameSetup(gameId: GameId): Promise<void>;

  writeActiveGameStatus(gameId: GameId, game: ActiveGameStatus): Promise<void>;
  getActiveGameStatus(gameId: GameId): Promise<ActiveGameStatus | null>;

  writeDisconnectedUser(userId: UserId, record: DisconnectedSession): Promise<void>;
  getDisconnectedUser(userId: UserId): Promise<DisconnectedSession | null>;
  deleteDisconnectedUser(userId: UserId): Promise<void>;
}

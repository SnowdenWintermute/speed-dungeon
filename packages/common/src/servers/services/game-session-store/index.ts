import { GameName } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export interface GameSessionStoreService {
  writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void>;
  getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null>;
  deletePendingGameSetup(gameName: GameName): Promise<void>;

  writeActiveGameStatus(gameName: GameName, game: ActiveGameStatus): Promise<void>;
  getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null>;

  writeDisconnectedUser(userId: UserId, record: DisconnectedSession): Promise<void>;
  getDisconnectedUser(userId: UserId): Promise<DisconnectedSession | null>;
  deleteDisconnectedUser(userId: UserId): Promise<void>;
}

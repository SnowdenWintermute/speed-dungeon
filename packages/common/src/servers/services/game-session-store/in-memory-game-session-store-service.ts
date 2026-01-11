import { GameName } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  writeActiveGameStatus(gameName: GameName, game: ActiveGameStatus): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null> {
    throw new Error("Method not implemented.");
  }
  writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null> {
    throw new Error("Method not implemented.");
  }
  deletePendingGameSetup(gameName: GameName): Promise<void> {
    throw new Error("Method not implemented.");
  }
  writeActiveGame(gameName: GameName, game: ActiveGameStatus): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getActiveGame(gameName: GameName): Promise<ActiveGameStatus | null> {
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

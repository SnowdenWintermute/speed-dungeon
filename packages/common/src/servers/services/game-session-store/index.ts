import { GameName } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export interface GameSessionStoreService {
  writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void>;
  getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null>;
  deletePendingGameSetup(gameName: GameName): Promise<void>;

  writeActiveGameStatus(gameName: GameName, game: ActiveGameStatus): Promise<void>;
  refreshActiveGameStatus(gameName: GameName): Promise<void>;
  getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null>;
  deleteActiveGameStatus(gameName: GameName): Promise<void>;

  getActiveGames(): Promise<ActiveGameStatus[]>;
  getPendingGameSetups(): Promise<PendingGameSetup[]>;
}

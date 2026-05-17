import { GameId, GameName } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export interface GameSessionStoreService {
  writePendingGameSetup(gameId: GameId, setup: PendingGameSetup): Promise<void>;
  getPendingGameSetup(gameId: GameId): Promise<PendingGameSetup | null>;
  getPendingGameSetupByName(gameName: GameName): Promise<PendingGameSetup | null>;
  deletePendingGameSetup(gameId: GameId): Promise<void>;

  writeActiveGameStatus(gameId: GameId, game: ActiveGameStatus): Promise<void>;
  refreshActiveGameStatus(gameId: GameId): Promise<void>;
  getActiveGameStatus(gameId: GameId): Promise<ActiveGameStatus | null>;
  getActiveGameStatusByName(gameName: GameName): Promise<ActiveGameStatus | null>;
  deleteActiveGameStatus(gameId: GameId): Promise<void>;

  getActiveGames(): Promise<ActiveGameStatus[]>;
  getPendingGameSetups(): Promise<PendingGameSetup[]>;
}

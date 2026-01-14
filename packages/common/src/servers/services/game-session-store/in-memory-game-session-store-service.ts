import { GameName } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  private pendingGameSetups = new Map<GameName, PendingGameSetup>();
  private activeGameStatusRecords = new Map<GameName, ActiveGameStatus>();

  async writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void> {
    this.pendingGameSetups.set(gameName, setup);
  }

  async getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null> {
    return this.pendingGameSetups.get(gameName) || null;
  }
  async deletePendingGameSetup(gameName: GameName): Promise<void> {
    this.pendingGameSetups.delete(gameName);
  }

  async writeActiveGameStatus(gameName: GameName, game: ActiveGameStatus): Promise<void> {
    this.activeGameStatusRecords.set(gameName, game);
  }
  async getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null> {
    return this.activeGameStatusRecords.get(gameName) || null;
  }
  async deleteActiveGameStatus(gameName: GameName): Promise<void> {
    this.activeGameStatusRecords.get(gameName);
  }
}

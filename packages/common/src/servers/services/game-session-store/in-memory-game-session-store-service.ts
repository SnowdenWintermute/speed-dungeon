import cloneDeep from "lodash.clonedeep";
import { GameName } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  private pendingGameSetups = new Map<GameName, PendingGameSetup>();
  private activeGameStatusRecords = new Map<GameName, ActiveGameStatus>();

  async writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void> {
    this.pendingGameSetups.set(gameName, cloneDeep(setup));
  }

  async getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null> {
    const gameOption = this.pendingGameSetups.get(gameName);

    return gameOption || null;
  }

  async deletePendingGameSetup(gameName: GameName): Promise<void> {
    this.pendingGameSetups.delete(gameName);
  }

  async writeActiveGameStatus(gameName: GameName, gameStatus: ActiveGameStatus): Promise<void> {
    this.activeGameStatusRecords.set(gameName, gameStatus);
  }

  async getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null> {
    return this.activeGameStatusRecords.get(gameName) || null;
  }

  async refreshActiveGameStatus(gameName: GameName): Promise<void> {
    const existing = await this.getActiveGameStatus(gameName);
    if (!existing) {
      console.info("Tried to refresh a non-existant ActiveGameStatus");
      return;
    }
    existing.refresh();
  }

  async deleteActiveGameStatus(gameName: GameName): Promise<void> {
    this.activeGameStatusRecords.delete(gameName);
  }

  async getActiveGames(): Promise<ActiveGameStatus[]> {
    return [...this.activeGameStatusRecords.values()];
  }
  async getPendingGameSetups(): Promise<PendingGameSetup[]> {
    return [...this.pendingGameSetups.values()];
  }
}

import cloneDeep from "lodash.clonedeep";
import { GameId, GameName } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  private pendingGameSetups = new Map<GameId, PendingGameSetup>();
  private activeGameStatusRecords = new Map<GameId, ActiveGameStatus>();

  private pendingGameSetupNamesToIds = new Map<GameName, GameId>();
  private activeGameStatusRecordNamesToIds = new Map<GameName, GameId>();

  async writePendingGameSetup(gameId: GameId, setup: PendingGameSetup): Promise<void> {
    const existing = this.pendingGameSetups.get(gameId);
    if (existing && this.pendingGameSetupNamesToIds.get(existing.game.name) === gameId) {
      this.pendingGameSetupNamesToIds.delete(existing.game.name);
    }
    const cloned = cloneDeep(setup);
    this.pendingGameSetups.set(gameId, cloned);
    this.pendingGameSetupNamesToIds.set(cloned.game.name, gameId);
  }

  async getPendingGameSetup(gameId: GameId): Promise<PendingGameSetup | null> {
    const gameOption = this.pendingGameSetups.get(gameId);

    return gameOption || null;
  }
  async getPendingGameSetupByName(gameName: GameName): Promise<PendingGameSetup | null> {
    const idOption = this.pendingGameSetupNamesToIds.get(gameName);
    if (idOption === undefined) return null;
    return this.getPendingGameSetup(idOption);
  }

  async deletePendingGameSetup(gameId: GameId): Promise<void> {
    const existing = this.pendingGameSetups.get(gameId);
    if (existing && this.pendingGameSetupNamesToIds.get(existing.game.name) === gameId) {
      this.pendingGameSetupNamesToIds.delete(existing.game.name);
    }
    this.pendingGameSetups.delete(gameId);
  }

  async writeActiveGameStatus(gameId: GameId, gameStatus: ActiveGameStatus): Promise<void> {
    const existing = this.activeGameStatusRecords.get(gameId);
    if (existing && this.activeGameStatusRecordNamesToIds.get(existing.name) === gameId) {
      this.activeGameStatusRecordNamesToIds.delete(existing.name);
    }
    this.activeGameStatusRecords.set(gameId, gameStatus);
    this.activeGameStatusRecordNamesToIds.set(gameStatus.name, gameId);
  }

  async getActiveGameStatus(gameId: GameId): Promise<ActiveGameStatus | null> {
    return this.activeGameStatusRecords.get(gameId) || null;
  }
  async getActiveGameStatusByName(gameName: GameName): Promise<ActiveGameStatus | null> {
    const idOption = this.activeGameStatusRecordNamesToIds.get(gameName);
    if (idOption === undefined) return null;
    return this.getActiveGameStatus(idOption);
  }

  async refreshActiveGameStatus(gameId: GameId): Promise<void> {
    const existing = await this.getActiveGameStatus(gameId);
    if (!existing) {
      console.info("Tried to refresh a non-existant ActiveGameStatus");
      return;
    }
    existing.refresh();
  }

  async deleteActiveGameStatus(gameId: GameId): Promise<void> {
    const existing = this.activeGameStatusRecords.get(gameId);
    if (existing && this.activeGameStatusRecordNamesToIds.get(existing.name) === gameId) {
      this.activeGameStatusRecordNamesToIds.delete(existing.name);
    }
    this.activeGameStatusRecords.delete(gameId);
  }

  async getActiveGames(): Promise<ActiveGameStatus[]> {
    return [...this.activeGameStatusRecords.values()];
  }
  async getPendingGameSetups(): Promise<PendingGameSetup[]> {
    return [...this.pendingGameSetups.values()];
  }
}

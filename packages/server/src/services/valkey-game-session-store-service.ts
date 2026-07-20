import {
  ActiveGameStatus,
  GameId,
  GameName,
  GameSessionStoreService,
  PendingGameSetup,
} from "@speed-dungeon/common";
import { ValkeyManager } from "../kv-store/valkey-manager.js";

const PENDING_SETUPS_HASH = "game-session-store:pending-setups";
const PENDING_SETUP_NAME_TO_ID_HASH = "game-session-store:pending-setup-name-to-id";
const ACTIVE_STATUSES_HASH = "game-session-store:active-statuses";
const ACTIVE_STATUS_NAME_TO_ID_HASH = "game-session-store:active-status-name-to-id";

export class ValkeyGameSessionStoreService implements GameSessionStoreService {
  constructor(private readonly valkeyManager: ValkeyManager) {}

  async writePendingGameSetup(gameId: GameId, setup: PendingGameSetup): Promise<void> {
    const existing = await this.readPendingSetup(gameId);
    if (existing) {
      await this.clearNameIndexIfOwnedBy(PENDING_SETUP_NAME_TO_ID_HASH, existing.game.name, gameId);
    }
    await this.valkeyManager.hSet(
      PENDING_SETUPS_HASH,
      gameId,
      JSON.stringify(setup.toSerialized())
    );
    await this.valkeyManager.hSet(PENDING_SETUP_NAME_TO_ID_HASH, setup.game.name, gameId);
  }

  async getPendingGameSetup(gameId: GameId): Promise<PendingGameSetup | null> {
    return this.readPendingSetup(gameId);
  }

  async getPendingGameSetupByName(gameName: GameName): Promise<PendingGameSetup | null> {
    const idOption = await this.valkeyManager.hGet(PENDING_SETUP_NAME_TO_ID_HASH, gameName);
    if (idOption == null) {
      return null;
    }
    return this.readPendingSetup(idOption as GameId);
  }

  async deletePendingGameSetup(gameId: GameId): Promise<void> {
    const existing = await this.readPendingSetup(gameId);
    if (existing) {
      await this.clearNameIndexIfOwnedBy(PENDING_SETUP_NAME_TO_ID_HASH, existing.game.name, gameId);
    }
    await this.valkeyManager.hDel(PENDING_SETUPS_HASH, gameId);
  }

  async writeActiveGameStatus(gameId: GameId, gameStatus: ActiveGameStatus): Promise<void> {
    const existing = await this.readActiveStatus(gameId);
    if (existing) {
      await this.clearNameIndexIfOwnedBy(ACTIVE_STATUS_NAME_TO_ID_HASH, existing.name, gameId);
    }
    await this.valkeyManager.hSet(
      ACTIVE_STATUSES_HASH,
      gameId,
      JSON.stringify(gameStatus.toSerialized())
    );
    await this.valkeyManager.hSet(ACTIVE_STATUS_NAME_TO_ID_HASH, gameStatus.name, gameId);
  }

  async getActiveGameStatus(gameId: GameId): Promise<ActiveGameStatus | null> {
    return this.readActiveStatus(gameId);
  }

  async getActiveGameStatusByName(gameName: GameName): Promise<ActiveGameStatus | null> {
    const idOption = await this.valkeyManager.hGet(ACTIVE_STATUS_NAME_TO_ID_HASH, gameName);
    if (idOption == null) {
      return null;
    }
    return this.readActiveStatus(idOption as GameId);
  }

  async refreshActiveGameStatus(gameId: GameId): Promise<void> {
    const existing = await this.getActiveGameStatus(gameId);
    if (!existing) {
      console.info("Tried to refresh a non-existant ActiveGameStatus");
      return;
    }
    existing.refresh();
    await this.valkeyManager.hSet(
      ACTIVE_STATUSES_HASH,
      gameId,
      JSON.stringify(existing.toSerialized())
    );
  }

  async deleteActiveGameStatus(gameId: GameId): Promise<void> {
    const existing = await this.readActiveStatus(gameId);
    if (existing) {
      await this.clearNameIndexIfOwnedBy(ACTIVE_STATUS_NAME_TO_ID_HASH, existing.name, gameId);
    }
    await this.valkeyManager.hDel(ACTIVE_STATUSES_HASH, gameId);
  }

  async getActiveGames(): Promise<ActiveGameStatus[]> {
    const all = await this.valkeyManager.hGetAll(ACTIVE_STATUSES_HASH);
    return Object.values(all).map((raw) => ActiveGameStatus.fromSerialized(JSON.parse(raw)));
  }

  async getPendingGameSetups(): Promise<PendingGameSetup[]> {
    const all = await this.valkeyManager.hGetAll(PENDING_SETUPS_HASH);
    return Object.values(all).map((raw) => PendingGameSetup.fromSerialized(JSON.parse(raw)));
  }

  private async readPendingSetup(id: GameId): Promise<PendingGameSetup | null> {
    const raw = await this.valkeyManager.hGet(PENDING_SETUPS_HASH, id);
    if (raw == null) {
      return null;
    }
    return PendingGameSetup.fromSerialized(JSON.parse(raw));
  }

  private async readActiveStatus(id: GameId): Promise<ActiveGameStatus | null> {
    const raw = await this.valkeyManager.hGet(ACTIVE_STATUSES_HASH, id);
    if (raw == null) {
      return null;
    }
    return ActiveGameStatus.fromSerialized(JSON.parse(raw));
  }

  private async clearNameIndexIfOwnedBy(nameIndexHash: string, name: GameName, gameId: GameId) {
    const mappedId = await this.valkeyManager.hGet(nameIndexHash, name);
    if (mappedId === gameId) {
      await this.valkeyManager.hDel(nameIndexHash, name);
    }
  }
}

import cloneDeep from "lodash.clonedeep";
import { GameName, GuestUserId, IdentityProviderId } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";
import { TaggedUserId, UserIdType } from "../../sessions/user-ids.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  private pendingGameSetups = new Map<GameName, PendingGameSetup>();
  private activeGameStatusRecords = new Map<GameName, ActiveGameStatus>();

  // used for determining if a user is in a game on any game server when trying to do
  // actions restricted to only allowed when not in game, like delete saved character or
  // create a new game using saved characters
  private authIdsInGame = new Set<IdentityProviderId>();
  private guestIdsInGame = new Set<GuestUserId>();

  async writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void> {
    this.pendingGameSetups.set(gameName, cloneDeep(setup));
    this.registerTaggedUserIds(setup.taggedUserIds);
  }

  private registerTaggedUserIds(taggedUserIds: Set<TaggedUserId>) {
    for (const taggedUserId of taggedUserIds) {
      switch (taggedUserId.type) {
        case UserIdType.Auth:
          this.authIdsInGame.add(taggedUserId.id);
          break;
        case UserIdType.Guest:
          this.guestIdsInGame.add(taggedUserId.id);
          break;
      }
    }
  }

  private unregisterTaggedUserIds(taggedUserIds: Set<TaggedUserId>) {
    for (const taggedUserId of taggedUserIds) {
      switch (taggedUserId.type) {
        case UserIdType.Auth:
          this.authIdsInGame.delete(taggedUserId.id);
          break;
        case UserIdType.Guest:
          this.guestIdsInGame.delete(taggedUserId.id);
          break;
      }
    }
  }

  async getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null> {
    const gameOption = this.pendingGameSetups.get(gameName);

    return gameOption || null;
  }

  async deletePendingGameSetup(gameName: GameName): Promise<void> {
    const existing = await this.getPendingGameSetup(gameName);
    if (existing) {
      this.unregisterTaggedUserIds(existing.taggedUserIds);
    }

    this.pendingGameSetups.delete(gameName);
  }

  async writeActiveGameStatus(gameName: GameName, gameStatus: ActiveGameStatus): Promise<void> {
    this.activeGameStatusRecords.set(gameName, gameStatus);
    this.registerTaggedUserIds(gameStatus.taggedUserIds);
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
    const existing = await this.getActiveGameStatus(gameName);
    if (existing) {
      this.unregisterTaggedUserIds(existing.taggedUserIds);
    }
    this.activeGameStatusRecords.delete(gameName);
  }

  async getActiveGames(): Promise<ActiveGameStatus[]> {
    return [...this.activeGameStatusRecords.values()];
  }
  async getPendingGameSetups(): Promise<PendingGameSetup[]> {
    return [...this.pendingGameSetups.values()];
  }

  async getUserIdIsInPendingOrActiveGame(userId: TaggedUserId): Promise<boolean> {
    switch (userId.type) {
      case UserIdType.Auth:
        return this.authIdsInGame.has(userId.id);
      case UserIdType.Guest:
        return this.guestIdsInGame.has(userId.id);
    }
  }

  async unregisterUserIdFromActiveGame(userId: TaggedUserId, gameName: GameName): Promise<void> {
    const activeGameStatus = await this.getActiveGameStatus(gameName);
    activeGameStatus?.removeTaggedUserId(userId);

    switch (userId.type) {
      case UserIdType.Auth:
        this.authIdsInGame.delete(userId.id);
        return;
      case UserIdType.Guest:
        this.guestIdsInGame.delete(userId.id);
        return;
    }
  }
}

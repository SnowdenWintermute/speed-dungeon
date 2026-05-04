import cloneDeep from "lodash.clonedeep";
import { GameName, GuestUserId, IdentityProviderId } from "../../../aliases.js";
import { ActiveGameStatus } from "./active-game-status.js";
import { GameSessionStoreService } from "./index.js";
import { PendingGameSetup } from "./pending-game-setup.js";
import { AuthTaggedUserId, TaggedUserId } from "../../sessions/user-ids.js";

export class InMemoryGameSessionStoreService implements GameSessionStoreService {
  private pendingGameSetups = new Map<GameName, PendingGameSetup>();
  private activeGameStatusRecords = new Map<GameName, ActiveGameStatus>();

  // update set of ids in game when:
  // - writePendingGameSetup
  // - writeActiveGameStatus
  //
  // writeActiveGameStatus with all TaggedUserIds in game when:
  // - activating a pending game on first user join (just transfer over the TaggedUserIds expected in the PendingGameSetup)
  // - a user intentionally leaves a game
  // - a user's reconnection opportunity times out
  //
  private authIdsInGame = new Set<IdentityProviderId>();
  private guestIdsInGame = new Set<GuestUserId>();

  // We'll add in the list of TaggedUserId to the setup and update the aggregate sets
  async writePendingGameSetup(gameName: GameName, setup: PendingGameSetup): Promise<void> {
    this.pendingGameSetups.set(gameName, cloneDeep(setup));
  }

  async getPendingGameSetup(gameName: GameName): Promise<PendingGameSetup | null> {
    const gameOption = this.pendingGameSetups.get(gameName);
    return gameOption || null;
  }

  // we'll update the aggregate sets by deleting the associated TaggedUserId on the pending game setup
  async deletePendingGameSetup(gameName: GameName): Promise<void> {
    this.pendingGameSetups.delete(gameName);
  }

  // @TODO - add a
  // refreshActiveGameStatus(){
  // just updates the createdAt
  // }

  // we'll store a list of TaggedUserId on the ActiveGameStatus and update the sets
  async writeActiveGameStatus(gameName: GameName, game: ActiveGameStatus): Promise<void> {
    this.activeGameStatusRecords.set(gameName, game);
  }

  async getActiveGameStatus(gameName: GameName): Promise<ActiveGameStatus | null> {
    return this.activeGameStatusRecords.get(gameName) || null;
  }

  // we'll delete the stored TaggedUserId from the sets
  async deleteActiveGameStatus(gameName: GameName): Promise<void> {
    this.activeGameStatusRecords.delete(gameName);
  }

  async getActiveGames(): Promise<ActiveGameStatus[]> {
    return [...this.activeGameStatusRecords.values()];
  }
  async getPendingGameSetups(): Promise<PendingGameSetup[]> {
    return [...this.pendingGameSetups.values()];
  }

  async getUserIdIsInPendingOrActiveGame(userId: TaggedUserId): Promise<GameName | null> {
    throw new Error("not implemented");
  }
}

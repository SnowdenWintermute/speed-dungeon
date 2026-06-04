import { CombatantId, GameId, IdentityProviderId, Username } from "../../aliases.js";
import { DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { SerializedOf } from "../../serialization/index.js";
import { invariant } from "../../utils/index.js";
import { GameRegistry } from "../game-registry.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
import { SavedIronmanRun } from "../services/user-game-data-persistence/saved-ironman-runs.js";
import { UserIdType } from "../sessions/user-ids.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export class IronmanRunController {
  constructor(
    protected userGameDataPersistenceService: UserGameDataPersistenceService,
    protected profilesService: SpeedDungeonProfileService,
    protected gameRegistry: GameRegistry,
    protected userSessionRegistry: UserSessionRegistry,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  // from lobby, need bespoke ClientIntent and handler
  async abandonRun(userSession: UserSession, runId: GameId) {
    //   .don't allow if run is in a live game (player can leave the game first, closing the game for all players, then abandon)
    //   .remove the player
    //   .if no players remain, delete the saved run record
    //   .else update their owned characters to be owned by the next least recently
    //    joined player (need to record join order on players then)
    //   .remove the reference to the run in their user Profile
    //   .tell the user about it
    //   .if there is any live lobby session for this run (another player in the run waiting in a lobby game for it)
    //   tell that other game's users that this player abandoned
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    return outbox;
  }

  // from lobby, need bespoke ClientIntent and handler
  // or automatically done on run abandonment
  transferCharacterOwnership(
    gameId: GameId,
    characterId: CombatantId,
    from: Username,
    to: Username
  ) {
    const game = this.gameRegistry.requireGame(gameId);
    game.transferCharacterOwnership(characterId, from, to);
  }

  async getUserSavedIronmanRunsOutbox(
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    invariant(
      session.taggedUserId.type === UserIdType.Auth,
      ERROR_MESSAGES.SERVER.EXPECTED_AUTH_USER
    );
    const userId = session.taggedUserId.id;
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    const profile = await this.profilesService.fetchExpectedProfile(userId);
    const { ironmanRunIds } = profile;
    const savedIronmanRuns: SerializedOf<SavedIronmanRun>[] = [];

    // @TODO
    // in case their profile was made before the change to the structure of profiles to include ironman runs
    // handle the update based on a future "profile schema version" field

    console.log("profile has run ids:", ironmanRunIds);

    for (const id of ironmanRunIds) {
      const run = await this.userGameDataPersistenceService.requireIronmanRun(id);
      savedIronmanRuns.push(run);
    }

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedIronmanRunsList,
      data: { savedIronmanRuns, ironmanRunCapacity: profile.ironmanRunCapacity },
    });
    return outbox;
  }
}

import { GameId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { SerializedOf } from "../../serialization/index.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { invariant } from "../../utils/index.js";
import { GameRegistry } from "../game-registry.js";
import { LobbyState } from "../lobby-server/lobby-state.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
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
    protected gameSessionStoreService: GameSessionStoreService,
    protected lobbyState: LobbyState,
    protected userSessionRegistry: UserSessionRegistry,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  // from lobby, need bespoke ClientIntent and handler
  async abandonRun(userSession: UserSession, runId: GameId) {
    invariant(userSession.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
    //   .don't allow if run is in a live game (player can leave the game first, closing the game for all players, then abandon)
    const gameIsLive = await this.gameSessionStoreService.getActiveGameStatus(runId);
    const gameHasPendingLiveSession = await this.gameSessionStoreService.getPendingGameSetup(runId);
    if (gameIsLive || gameHasPendingLiveSession) {
      throw new Error(ERROR_MESSAGES.GAME.ALREADY_LIVE);
    }
    const liveLobbyGameSessionOption = this.lobbyState.gameRegistry.getGameOption(runId);

    // don't let them abandon the run if they are in the game setup
    if (liveLobbyGameSessionOption) {
      const sessions = this.userSessionRegistry.getAllSessionsInGame(liveLobbyGameSessionOption);
      const userIsInGameSetupForThisRun = sessions.some(
        (session) => session.taggedUserId.id === userSession.taggedUserId.id
      );
      if (userIsInGameSetupForThisRun) {
        throw new Error(ERROR_MESSAGES.GAME_SETUP.CANT_ABANDON_WHILE_IN_SETUP);
      }
    }

    const serializedRun = await this.userGameDataPersistenceService.requireIronmanRun(runId);
    const run = SavedIronmanRun.fromSerialized(serializedRun);
    const playerCount = run.game.players.size;
    const playerUsernameLeaving = run.userIdsToUsernames.get(userSession.taggedUserId.id);
    invariant(playerUsernameLeaving !== undefined, "expected user to be in this run");

    const lastPlayerIsLeaving = playerCount === 1;
    if (lastPlayerIsLeaving) {
      //   .if no players would remain after this one, delete the saved run record
      await this.userGameDataPersistenceService.deleteIronmanRun(runId);
    } else {
      //   .else update their owned characters to be owned by the next least recently joined player
      run.game.transferCharactersToInheritingPlayer(playerUsernameLeaving);
      if (liveLobbyGameSessionOption) {
        liveLobbyGameSessionOption.transferCharactersToInheritingPlayer(playerUsernameLeaving);
      }
      // change the control scheme to Captains
      run.game.characterControlScheme = CharacterControlScheme.Captain;
    }

    //   .remove the player
    run.game.players.delete(playerUsernameLeaving);
    run.userIdsToUsernames.delete(userSession.taggedUserId.id);
    if (liveLobbyGameSessionOption) {
      liveLobbyGameSessionOption.playersReadied = [];
    }
    // - record player abandoning in game.playersAbandoned
    run.game.playersAbandoned.push(playerUsernameLeaving);
    //   .remove the reference to the run in their user Profile
    const profileOfUserLeaving = await this.profilesService.fetchExpectedProfile(
      userSession.taggedUserId.id
    );
    ArrayUtils.removeElement(profileOfUserLeaving.ironmanRunIds, runId);
    await this.profilesService.update(userSession.taggedUserId.id, profileOfUserLeaving);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    //   .tell the user about it
    outbox.pushToConnection(userSession.connectionId, {
      type: GameStateUpdateType.IronmanRunAbandoned,
      data: { usernameAbandoning: userSession.username, runId },
    });
    //   .if there is any live lobby session for this run (another player in the run waiting in a lobby game for it)

    if (liveLobbyGameSessionOption) {
      liveLobbyGameSessionOption.players.delete(playerUsernameLeaving);
      run.game.playersReadied = [];
      //   tell that other game's users that this player abandoned
      for (const session of this.userSessionRegistry.getAllSessionsInGame(
        liveLobbyGameSessionOption
      )) {
        outbox.pushToConnection(session.connectionId, {
          type: GameStateUpdateType.IronmanRunAbandoned,
          data: { usernameAbandoning: userSession.username, runId },
        });
      }
    }

    // this whole "look up their username to user id" map is gymnastics made necessary by the fact
    // that we don't want to reveal the user's identity provider ("auth") id to the clients. it does
    // add a fair bit of complexity though
    const userIdsToUsernames = run.userIdsToUsernames;
    if (!lastPlayerIsLeaving) {
      await this.userGameDataPersistenceService.saveIronmanRun(run.game, userIdsToUsernames);
    }

    return outbox;
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

    for (const id of ironmanRunIds) {
      const run = await this.userGameDataPersistenceService.requireIronmanRun(id);
      savedIronmanRuns.push(run);
    }

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.IronmanRunsList,
      data: {
        savedIronmanRuns: savedIronmanRuns.map((run) =>
          SavedIronmanRun.fromSerializedToClientEntry(run)
        ),
        ironmanRunCapacity: profile.ironmanRunCapacity,
      },
    });
    return outbox;
  }
}

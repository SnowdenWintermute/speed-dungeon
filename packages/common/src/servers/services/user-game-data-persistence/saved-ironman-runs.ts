import {
  APP_VERSION_NUMBER,
  ERROR_MESSAGES,
  GameId,
  IdentityProviderId,
  invariant,
  MapUtils,
  Serializable,
  SerializedOf,
  SpeedDungeonGame,
  UserIdType,
  Username,
} from "../../../index.js";
import { UserSession } from "../../sessions/user-session.js";

export class SavedIronmanRun implements Serializable {
  private _game: SpeedDungeonGame;

  constructor(
    game: SpeedDungeonGame,
    // in a game, characters are mapped by player username to character ids, but
    // usernames can change between a game save and load. On joining a loaded run
    // we will check for their old player and update its username if needed
    readonly userIdsToUsernames = new Map<IdentityProviderId, Username>(),
    readonly schemaVersion = APP_VERSION_NUMBER,
    public savedAt = Date.now()
  ) {
    this._game = game;
  }

  toSerialized() {
    return {
      schemaVersion: this.schemaVersion,
      _game: this._game.toSerialized(),
      userIdsToUsernames: MapUtils.serialize(this.userIdsToUsernames),
      savedAt: this.savedAt,
    };
  }

  static fromSerialized(serialized: SerializedOf<SavedIronmanRun>): SavedIronmanRun {
    return new SavedIronmanRun(
      SpeedDungeonGame.fromSerialized(serialized._game),
      MapUtils.deserialize(serialized.userIdsToUsernames, (v) => v as Username),
      serialized.schemaVersion,
      serialized.savedAt
    );
  }

  get game() {
    return this._game;
  }

  static createGameFromSavedRun(serialized: SerializedOf<SavedIronmanRun>) {
    const run = SavedIronmanRun.fromSerialized(serialized);

    run.game.markAsContinuedRun();
    run.game.timeHandedOff = null;

    for (const [username, player] of run.game.players) {
      player.awaitingControllingUserConnection = true;
    }

    return run.game;
  }

  containsPlayerControlledByUser(session: UserSession) {
    invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
    const existingPlayerUsername = this.userIdsToUsernames.get(session.taggedUserId.id);
    return existingPlayerUsername !== undefined;
  }

  // a player joining an Ironman run may have changed their username between the time
  // of the save and load
  updatePlayerOnJoin(session: UserSession) {
    invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
    const usernameAtTimeOfRunSave = this.userIdsToUsernames.get(session.taggedUserId.id);
    if (usernameAtTimeOfRunSave === undefined) {
      throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    }
    const player = this._game.getExpectedPlayer(usernameAtTimeOfRunSave);
    const oldUsername = player.username;
    const usernameChangedSinceLastGameSave = oldUsername !== session.username;
    if (usernameChangedSinceLastGameSave) {
      player.username = session.username;
      return { oldUsername, newUsername: session.username };
    }
  }
}

export interface IronmanRunPersistenceStrategy {
  save(run: SerializedOf<SavedIronmanRun>): Promise<void>;
  fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined>;
  delete(runId: GameId): Promise<void>;
}

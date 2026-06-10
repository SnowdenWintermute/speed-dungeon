import { instanceToPlain } from "class-transformer";
import {
  APP_VERSION_NUMBER,
  ArrayUtils,
  ERROR_MESSAGES,
  GameId,
  GameName,
  IdentityProviderId,
  invariant,
  MapUtils,
  Milliseconds,
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

  static fromSerializedToClientEntry(serialized: SerializedOf<SavedIronmanRun>) {
    return {
      gameId: serialized._game.id,
      gameName: serialized._game.name,
      schemaVersion: serialized.schemaVersion,
      savedAt: serialized.savedAt,
    };
  }

  get game() {
    return this._game;
  }

  static createGameFromSavedRun(serialized: SerializedOf<SavedIronmanRun>) {
    const run = SavedIronmanRun.fromSerialized(serialized);

    run.game.markAsContinuedRun();
    run.game.timeHandedOff = null;
    if (run.game.clock.isLive()) {
      run.game.clock.discardLiveSession();
    }

    run.game.playersReadied = [];

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
      this.userIdsToUsernames.set(session.taggedUserId.id, session.username);

      // this must be called on the run's saved game as well as the live lobby game setup
      this.game.updatePlayerWithNewUsername(oldUsername, session.username);

      return { oldUsername, newUsername: session.username };
    }
  }
}

export class SavedIronmanRunClientEntry implements Serializable {
  constructor(
    readonly gameId: GameId,
    readonly gameName: GameName,
    readonly schemaVersion: string,
    public savedAt: Milliseconds
  ) {}

  toSerialized() {
    return {
      gameId: this.gameId,
      gameName: this.gameName,
      schemaVersion: this.schemaVersion,
      savedAt: this.savedAt,
    };
  }

  static fromSerialized(
    serialized: SerializedOf<SavedIronmanRunClientEntry>
  ): SavedIronmanRunClientEntry {
    return new SavedIronmanRunClientEntry(
      serialized.gameId,
      serialized.gameName,
      serialized.schemaVersion,
      serialized.savedAt
    );
  }
}

export interface IronmanRunPersistenceStrategy {
  save(run: SerializedOf<SavedIronmanRun>): Promise<void>;
  fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined>;
  delete(runId: GameId): Promise<void>;
}

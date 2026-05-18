import {
  APP_VERSION_NUMBER,
  GameId,
  IdentityProviderId,
  MapUtils,
  Serializable,
  SerializedOf,
  SpeedDungeonGame,
  Username,
} from "../../../index.js";

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
}

export interface IronmanRunPersistenceStrategy {
  save(run: SerializedOf<SavedIronmanRun>): Promise<void>;
  fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined>;
  delete(runId: GameId): Promise<void>;
}

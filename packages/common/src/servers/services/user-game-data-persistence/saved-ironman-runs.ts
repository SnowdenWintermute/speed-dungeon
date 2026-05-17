import {
  APP_VERSION_NUMBER,
  CombatantId,
  GameId,
  IdentityProviderId,
  Milliseconds,
  SpeedDungeonGame,
} from "../../../index.js";

export class SavedIronmanRun {
  private schemaVersion: number = APP_VERSION_NUMBER;
  // in a game, characters are mapped by player username to character ids, but
  // usernames can change between a game save and load. We will add new SpeedDungeonPlayer
  // to the loaded game and give them control of their character ids
  userIdsToControlledCharacters = new Map<IdentityProviderId, CombatantId[]>();
  updatedAt: Milliseconds = Date.now();

  constructor(game: SpeedDungeonGame) {
    // characters will be stripped from the game and saved on the controlling user's
    // character slots to piggyback on current progression game character persistence methodology
  }
}

export interface IronmanRunPersistenceStrategy {
  insert(game: SpeedDungeonGame): Promise<void>;
  update(game: SpeedDungeonGame): Promise<void>;
  fetchRun(gameId: GameId): Promise<SpeedDungeonGame | undefined>;
}

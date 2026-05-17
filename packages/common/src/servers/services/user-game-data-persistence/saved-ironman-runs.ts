import {
  CombatantId,
  GameId,
  IdentityProviderId,
  Milliseconds,
  SpeedDungeonGame,
} from "../../../index.js";

export interface SavedIronmanRun {
  schemaVersion: number;
  // characters will be stripped from the game and saved on the controlling user's
  // character slots to piggyback on current progression game character persistence methodology
  game: SpeedDungeonGame;
  // in a game, characters are mapped by player username to character ids, but
  // usernames can change between a game save and load. We will add new SpeedDungeonPlayer
  // to the loaded game and give them control of their character ids
  userIdsToControlledCharacters: Map<IdentityProviderId, CombatantId[]>;
  updatedAt: Milliseconds; // timestamp
}

export interface IronmanRunPersistenceStrategy {
  insert(game: SpeedDungeonGame): Promise<void>;
  update(game: SpeedDungeonGame): Promise<void>;
  fetchRun(gameId: GameId): Promise<SpeedDungeonGame | undefined>;
}

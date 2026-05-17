import { EntityId, IdentityProviderId, Username } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { CharacterSlot } from "../servers/services/user-game-data-persistence/character-slots.js";
import { GameModeLadderUpdatePolicy } from "./ladder-update-policy.js";
import { GameModeLobbySetupPolicy } from "./lobby-setup-policy.js";
import { GameModePersistencePolicy } from "./persistence-policy.js";

export enum CharacterControlScheme {
  Freelancer, // each player controls a single character
  Captain, // each player may control one or more characters
}

export enum GameMode {
  Progression,
  Ironman,
  UnrankedRace,
  RankedRace,
}

export const GAME_MODE_STRINGS: Record<GameMode, string> = {
  [GameMode.Progression]: "Progression",
  [GameMode.Ironman]: "Ironman",
  [GameMode.UnrankedRace]: "Unranked Race",
  [GameMode.RankedRace]: "Ranked Race",
};

export interface GameModePolicy {
  setup: GameModeLobbySetupPolicy;
  persistence: GameModePersistencePolicy;
  ladder: GameModeLadderUpdatePolicy;
}

export interface UserAccountPersistentGameData {
  // slots array length limited by user account and control scheme
  progressionCharacters: Record<CharacterControlScheme, CharacterSlot[]>;
  ironmanCharacters: Record<CharacterControlScheme, CharacterSlot[]>;
  // ironman runs array length limited by user account and control scheme
  ironmanRunIds: Record<CharacterControlScheme, EntityId[]>;
  raceGameRecordIds: Record<CharacterControlScheme, Record<number, EntityId[]>>; // number is year + month (Epoch?)
}

export interface SavedIronmanRun {
  game: SpeedDungeonGame;
  // users know what run ids they are in, they can load one of these records to
  // continue a run, but if they have changed their username since the run was saved
  // we need to know what their name was at the time it was saved so we know what characters
  // they were in control of since character ownership is by player username (so clients don't know account ids)
  userIdsToPlayerNames: Map<IdentityProviderId, Username>;
  // on load, mark the run as in progress so it can't be loaded in two games at once
  isInProgress: boolean;
}

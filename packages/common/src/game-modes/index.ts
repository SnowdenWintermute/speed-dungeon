import { EntityId } from "../aliases.js";
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
  // ironman runs array length limited by user account and control scheme
  ironmanRunIds: Record<CharacterControlScheme, EntityId[]>;
  raceGameRecordIds: Record<CharacterControlScheme, Record<number, EntityId[]>>; // number is year + month (Epoch?)
}

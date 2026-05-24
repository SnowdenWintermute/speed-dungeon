import { EntityId } from "../aliases.js";
import { SavedCharacterListEntry } from "../servers/services/user-game-data-persistence/saved-character-list-entry.js";
import { GameModeGameInitializationPolicy } from "./game-initialization-policy.js";
import { GameModeLadderUpdatePolicy } from "./ladder-update-policy.js";
import { GameModeLobbySetupPolicy } from "./lobby-setup-policy.js";
import { GameModePersistencePolicy } from "./persistence-policy.js";

export enum CharacterControlScheme {
  Freelancer, // each player controls a single character
  Captain, // each player may control one or more characters
}

export const CHARACTER_CONTROL_SCHEME_STRINGS: Record<CharacterControlScheme, string> = {
  [CharacterControlScheme.Freelancer]: "Freelancer",
  [CharacterControlScheme.Captain]: "Captain",
};

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
  lobbySetup: GameModeLobbySetupPolicy;
  persistence: GameModePersistencePolicy;
  ladder: GameModeLadderUpdatePolicy;
  gameInitialization: GameModeGameInitializationPolicy;
}

export interface UserAccountPersistentGameData {
  // slots array length limited by user account and control scheme
  progressionCharacters: Record<CharacterControlScheme, SavedCharacterListEntry[]>;
  // ironman runs array length limited by user account and control scheme
  ironmanRunIds: Record<CharacterControlScheme, EntityId[]>;
  raceGameRecordIds: Record<CharacterControlScheme, Record<number, EntityId[]>>; // number is year + month (Epoch?)
}

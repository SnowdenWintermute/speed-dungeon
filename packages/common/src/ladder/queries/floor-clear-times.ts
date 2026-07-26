import {
  CombatantId,
  GameId,
  LadderCharacterFloorClearRecordId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";

// TPlayer, as on FloorClear: the owner is an id as persisted and a username in the client view
export interface FloorClearCharacter<TPlayer> {
  characterId: CombatantId;
  characterName: string;
  snapshotIdOption?: LadderCharacterFloorClearRecordId;
  mainClass: { combatantClass: CombatantClass; level: number };
  supportClassOption?: { combatantClass: CombatantClass; level: number };
  owner: TPlayer;
}

export enum FloorClearSortField {
  TimeSpentOnFloor,
  CumulativeTimeToClearFloor,
}

// sorting has to happen server-side: reordering a fetched page would only reorder those rows
export interface FloorClearSort {
  field: FloorClearSortField;
  isDescending: boolean;
}

export const DEFAULT_FLOOR_CLEAR_SORT: FloorClearSort = {
  field: FloorClearSortField.TimeSpentOnFloor,
  isDescending: false,
};

export interface FloorClearTimesQuery {
  floor: number;
  page: number;
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
  sortOption?: FloorClearSort;
}

// the same floor clears, across every floor instead of one, ordered by how deep the clear was and
// then by how fast the party got there. spans game modes deliberately: ironman and race play by the
// same rules, so a clear means the same thing in both. each control scheme is its own board
export interface CumulativeClearTimesQuery {
  controlScheme: CharacterControlScheme;
  page: number;
}

// TPlayer = IdentityProviderID (as persisted) or Username (for client view)
export interface FloorClear<TPlayer> {
  rank: number;
  gameRecordId: GameId;
  partyRecordId: PartyId;
  partyName: PartyName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  floor: number;
  timeSpentOnFloor: Milliseconds;
  // time from start of game until floor cleared
  cumulativeTimeToClearFloor: Milliseconds;
  gameStartedAt: Milliseconds;
  // wall-clock time of this clear, which period leaderboards filter on
  clearedAt: Milliseconds;
  players: TPlayer[];
  characters: FloorClearCharacter<TPlayer>[];
}

export type FloorClearView = FloorClear<Username>;

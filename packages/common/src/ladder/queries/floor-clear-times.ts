import {
  CombatantId,
  GameId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { PagedLadderQuery } from "./ladder-page.js";

// who a character is, wherever one is displayed. TPlayer, as on FloorClear: the owner is an id as
// persisted and a username in the client view
export interface LadderCharacterView<TPlayer> {
  characterId: CombatantId;
  characterName: string;
  mainClass: { combatantClass: CombatantClass; level: number };
  supportClassOption?: { combatantClass: CombatantClass; level: number };
  owner: TPlayer;
}

// a character shown in the context of one clear, which is what lets it name a single snapshot. a
// character listed outside that context (a whole game's party) has one snapshot per clear instead,
// so the link lives on the clear there
export interface FloorClearCharacter<TPlayer> extends LadderCharacterView<TPlayer> {
  snapshotIdOption?: LadderCharacterFloorClearRecordId;
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

export interface FloorClearTimesQuery extends PagedLadderQuery {
  floor: number;
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
  sortOption?: FloorClearSort;
}

// the same floor clears, across every floor instead of one, ordered by how deep the clear was and
// then by how fast the party got there. spans game modes deliberately: ironman and race play by the
// same rules, so a clear means the same thing in both. each control scheme is its own board
export interface CumulativeClearTimesQuery extends PagedLadderQuery {
  controlScheme: CharacterControlScheme;
}

// the clear itself, with nothing about the party or game that made it. a game record nests these
// under the party they belong to, which already carries that context
export interface FloorClearDetail {
  id: LadderPartyFloorClearRecordId;
  controlScheme: CharacterControlScheme;
  floor: number;
  timeSpentOnFloor: Milliseconds;
  // time from start of game until floor cleared
  cumulativeTimeToClearFloor: Milliseconds;
  // wall-clock time of this clear, which period leaderboards filter on
  clearedAt: Milliseconds;
}

// a clear standing on its own, as a board row or its own page: it has to name the party and game it
// came from. TPlayer = IdentityProviderID (as persisted) or Username (for client view)
export interface FloorClear<TPlayer> extends FloorClearDetail {
  gameRecordId: GameId;
  partyRecordId: PartyId;
  partyName: PartyName;
  mode: GameMode;
  gameStartedAt: Milliseconds;
  players: TPlayer[];
  characters: FloorClearCharacter<TPlayer>[];
}

// a clear's position on some board. rank belongs to the position, not to the clear, so a clear
// fetched on its own — or listed as a personal best — has no rank to report
export interface RankedFloorClear<TPlayer> extends FloorClear<TPlayer> {
  rank: number;
}

export type FloorClearView = FloorClear<Username>;
export type RankedFloorClearView = RankedFloorClear<Username>;

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

export interface FloorClearCharacter {
  characterId: CombatantId;
  characterName: string;
  snapshotIdOption?: LadderCharacterFloorClearRecordId;
}

// every floor clear that exists for the filter, sorted fastest-first by default. only race +
// ironman record floor clears; progression does not.
export interface FloorClearTimesQuery {
  floor: number;
  page: number;
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
}

// one floor-clear read model, generic over how players are referenced. the persistence read side
// keys players by IdentityProviderId (FloorClearEntry, in the records layer); the client-facing view
// keys them by Username (FloorClearView). the LadderQueries impl converts one to the other by
// resolving the player refs — every other field is shared, so the two shapes can't drift.
export interface FloorClear<TPlayer> {
  rank: number;
  gameRecordId: GameId;
  partyRecordId: PartyId;
  partyName: PartyName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  floor: number;
  // active time on this floor alone
  timeSpentOnFloor: Milliseconds;
  // active time from game start through clearing this floor: running total of timeSpentOnFloor over
  // floors 1..this, which are expected to all exist (invariant — a gap is a write-path bug)
  cumulativeTimeToClearFloor: Milliseconds;
  // the run's date, for sorting/showing floor clears by when the run happened (= game start).
  // NOT when floor X was cleared — no absolute per-floor timestamp is stored (see notes).
  gameStartedAt: Milliseconds;
  players: TPlayer[];
  characters: FloorClearCharacter[];
}

export type FloorClearView = FloorClear<Username>;

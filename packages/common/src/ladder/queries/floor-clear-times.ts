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

export interface FloorClearCharacterView {
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

export interface FloorClearView {
  rank: number;
  gameRecordId: GameId;
  partyRecordId: PartyId;
  partyName: PartyName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  floor: number;
  timeSpentOnFloor: Milliseconds;
  clearedAt: Milliseconds;
  players: Username[];
  characters: FloorClearCharacterView[];
}

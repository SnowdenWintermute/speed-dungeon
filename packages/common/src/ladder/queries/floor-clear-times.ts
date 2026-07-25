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

export interface FloorClearTimesQuery {
  floor: number;
  page: number;
  controlSchemeOption?: CharacterControlScheme;
  modeOption?: GameMode;
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
  players: TPlayer[];
  characters: FloorClearCharacter[];
}

export type FloorClearView = FloorClear<Username>;

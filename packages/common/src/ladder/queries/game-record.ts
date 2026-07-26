import {
  CombatantId,
  GameId,
  GameName,
  LadderCharacterFloorClearRecordId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { PartyFate } from "../records/index.js";
import { FloorClearDetail, LadderCharacterView } from "./floor-clear-times.js";

// one whole game: its parties, what each party cleared, and who was in them. no TPlayer generic like
// FloorClear has — the persisted side of this is LadderGameRecordAggregate, which is records rather
// than a parallel id-keyed view
export interface GameRecordView {
  gameRecordId: GameId;
  name: GameName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  timeStarted: Milliseconds;
  participants: GameRecordParticipantView[];
  parties: GameRecordPartyView[];
}

export interface GameRecordParticipantView {
  username: Username;
  abandonedAtOption?: Milliseconds;
}

export interface GameRecordPartyView {
  partyRecordId: PartyId;
  partyName: PartyName;
  fateOption?: PartyFate;
  deepestFloorReached: number;
  // listed once for the party rather than per clear: the character record is last-known state, so it
  // is the same record whichever clear you reach it from — and a party that cleared no floor at all
  // still has characters to show, so this cannot be derived from the clears
  characters: LadderCharacterView<Username>[];
  floorClears: GameRecordFloorClearView[];
}

// the party and game this clear belongs to are the objects above it, so FloorClearDetail is all of
// the clear that is left to state
export interface GameRecordFloorClearView extends FloorClearDetail {
  characterSnapshots: GameRecordCharacterSnapshotLink[];
}

// the snapshot taken of one character at one clear. on a board this is FloorClearCharacter's
// snapshotIdOption; here the characters are listed outside any one clear, so the link sits on the
// clear and names the character instead
export interface GameRecordCharacterSnapshotLink {
  characterId: CombatantId;
  snapshotId: LadderCharacterFloorClearRecordId;
}

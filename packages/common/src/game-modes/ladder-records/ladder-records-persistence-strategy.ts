import {
  CombatantId,
  GameId,
  GameName,
  IdentityProviderId,
  Milliseconds,
  PartyId,
} from "../../aliases.js";
import { DateRange } from "../../primatives/date-range.js";
import {
  LadderCharacterFloorClearRecord,
  LadderCharacterRecord,
  LadderGameParticipationRecord,
  LadderGameRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  PartyFate,
} from "./index.js";

export interface NewLadderGameRecordSet {
  game: LadderGameRecord;
  participantRecords: LadderParticipantRecord[];
  parties: LadderPartyRecord[];
  characters: LadderCharacterRecord[];
}

export interface LadderCharacterLevelUpdate {
  characterRecordId: CombatantId;
  mainClassLevel: number;
  supportClassLevel?: number;
}

export interface LadderPartyFateUpdate {
  partyRecordId: PartyId;
  fate: PartyFate;
  deepestFloorReached: number;
}

// assembled read shape (the parent "refs" arrays expressed as nested children)
export interface LadderCharacterRecordAggregate {
  character: LadderCharacterRecord;
  floorClearedSnapshots: LadderCharacterFloorClearRecord[];
}
export interface LadderPartyRecordAggregate {
  party: LadderPartyRecord;
  floorClears: LadderPartyFloorClearRecord[];
  characters: LadderCharacterRecordAggregate[];
}
export interface LadderGameRecordAggregate {
  game: LadderGameRecord;
  participants: LadderParticipantRecord[];
  participations: LadderGameParticipationRecord[];
  parties: LadderPartyRecordAggregate[];
}

// a row in a user's paginated game-history list. fateOptionOfQueryingPlayerParty is the fate of
// the party that the querying user's character(s) were in (undefined while the game is in progress)
export interface UserGameHistoryEntry {
  gameId: GameId;
  gameName: GameName;
  date: Milliseconds;
  fateOptionOfQueryingPlayerParty?: PartyFate;
  queryingPlayerAbandonedAtOption?: Milliseconds;
}

export interface LadderRecordsPersistenceStrategy {
  getUserGameHistory(
    userId: IdentityProviderId,
    page: number,
    dateRange?: DateRange
  ): Promise<UserGameHistoryEntry[]>;
  getUserGameRecordsCount(userId: IdentityProviderId, dateRange?: DateRange): Promise<number>;

  // participants are global per user; resolve before building character/game records that reference them
  findParticipantRecordById(id: IdentityProviderId): Promise<LadderParticipantRecord | undefined>;
  upsertParticipantRecord(record: LadderParticipantRecord): Promise<void>;
  updateGameRecord(record: LadderGameRecord): Promise<void>;
  findPartyRecordById(id: PartyId): Promise<LadderPartyRecord>;
  updatePartyRecord(record: LadderPartyRecord): Promise<void>;
  updateCharacterRecord(record: LadderCharacterRecord): Promise<void>;

  // atomic: a game plus its parties, characters, and participant links
  insertNewGameRecordSet(set: NewLadderGameRecordSet): Promise<void>;

  recordPartyFloorClear(
    partyFloorClear: LadderPartyFloorClearRecord,
    characterFloorClears: LadderCharacterFloorClearRecord[]
  ): Promise<void>;

  updatePartyFate(update: LadderPartyFateUpdate): Promise<void>;

  recordRunAbandonment(
    gameRecordId: GameId,
    participantRecordId: IdentityProviderId,
    timestamp: Milliseconds
  ): Promise<void>;

  findGameRecordAggregateById(id: GameId): Promise<LadderGameRecordAggregate | undefined>;
}

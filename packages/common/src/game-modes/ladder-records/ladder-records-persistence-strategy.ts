import {
  IdentityProviderId,
  LadderCharacterRecordId,
  LadderGameRecordId,
  LadderParticipantRecordId,
  LadderPartyRecordId,
} from "../../aliases.js";
import {
  LadderCharacterFloorClearedRecord,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderParticipantRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  PartyFate,
} from "./index.js";

// insert shapes omit the derived "list of children" fields, which are reconstructed at read time
export type LadderGameRecordInsert = Omit<
  LadderGameRecord,
  "partyRecordRefs" | "participantRecords"
>;
export type LadderPartyRecordInsert = Omit<
  LadderPartyRecord,
  "characterRecordRefs" | "partyFloorClearRecordRefs"
>;
export type LadderCharacterRecordInsert = Omit<LadderCharacterRecord, "floorClearRecordIds">;

export interface NewLadderGameRecordSet {
  game: LadderGameRecordInsert;
  // participants are global per user and resolved/created ahead of time; we only link them here
  participantRecordIds: LadderParticipantRecordId[];
  parties: LadderPartyRecordInsert[];
  characters: LadderCharacterRecordInsert[];
}

export interface LadderCharacterLevelUpdate {
  characterRecordId: LadderCharacterRecordId;
  mainClassLevel: number;
  supportClassLevel?: number;
}

export interface LadderPartyFloorClearWrite {
  partyRecordId: LadderPartyRecordId;
  partyFloorClear: LadderPartyFloorClearRecord;
  characterSnapshots: LadderCharacterFloorClearedRecord[];
  deepestFloorReached: number;
  characterLevelUpdates: LadderCharacterLevelUpdate[];
}

export interface LadderPartyFateUpdate {
  partyRecordId: LadderPartyRecordId;
  fate: PartyFate;
  deepestFloorReached: number;
}

// assembled read shape (the parent "refs" arrays expressed as nested children)
export interface LadderCharacterRecordAggregate {
  character: LadderCharacterRecordInsert;
  floorClearedSnapshots: LadderCharacterFloorClearedRecord[];
}
export interface LadderPartyRecordAggregate {
  party: LadderPartyRecordInsert;
  floorClears: LadderPartyFloorClearRecord[];
  characters: LadderCharacterRecordAggregate[];
}
export interface LadderGameRecordAggregate {
  game: LadderGameRecordInsert;
  participants: LadderParticipantRecord[];
  parties: LadderPartyRecordAggregate[];
}

export interface LadderRecordsPersistenceStrategy {
  // participants are global per user; resolve before building character/game records that reference them
  findParticipantRecordByUserId(
    userId: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined>;
  upsertParticipantRecord(record: LadderParticipantRecord): Promise<void>;

  // atomic: a game plus its parties, characters, and participant links
  insertNewGameRecordSet(set: NewLadderGameRecordSet): Promise<void>;

  // atomic: a party clearing a floor — floor-clear row, character snapshots, and the
  // denormalized deepest-floor / character-level updates that go with it
  recordPartyFloorClear(write: LadderPartyFloorClearWrite): Promise<void>;

  updatePartyFate(update: LadderPartyFateUpdate): Promise<void>;

  findGameRecordAggregateById(
    id: LadderGameRecordId
  ): Promise<LadderGameRecordAggregate | undefined>;
}

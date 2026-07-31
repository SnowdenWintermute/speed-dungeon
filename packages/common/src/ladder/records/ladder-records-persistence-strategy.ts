import {
  CombatantId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Milliseconds,
  PartyId,
  Username,
} from "../../aliases.js";
import { DateRange } from "../../primatives/date-range.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { LadderPage } from "../queries/ladder-page.js";
import {
  CumulativeClearTimesQuery,
  FloorClear,
  FloorClearTimeRanks,
  FloorClearTimesQuery,
  RankedFloorClear,
} from "../queries/floor-clear-times.js";
import { WinRateLadderQuery } from "../queries/win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "../queries/character-floor-clear-snapshot.js";
import { UserGameHistoryEntry } from "../queries/user-game-history.js";
import {
  FloorClearSnapshotRef,
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
  // refs, not records: a whole game's worth of serialized combatants is the largest payload in the
  // schema, and nothing that reads an aggregate wants more than the id to link by
  floorClearedSnapshots: FloorClearSnapshotRef[];
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

export type FloorClearEntry = FloorClear<IdentityProviderId>;
export type RankedFloorClearEntry = RankedFloorClear<IdentityProviderId>;

// no winRate: that 0..1 display figure is derived during View assembly, not stored here
export interface WinLossTally {
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export interface WinRateEntry {
  rank: number;
  participantId: IdentityProviderId;
  tally: WinLossTally;
}

// two lists of the same rows selected by different clocks: the fastest the player has taken a floor,
// and the fastest they have ever arrived at one. a run can hold one and not the other
export interface PlayerProfileData {
  participantId: IdentityProviderId;
  rankedRaceTally: WinLossTally;
  personalBestFloorTimes: FloorClearEntry[];
  personalBestCumulativeTimes: FloorClearEntry[];
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
  // no-op for a user with no participant record: only players with ladder history have one, and a
  // record is never created just because someone connected
  refreshParticipantUsername(id: IdentityProviderId, username: Username): Promise<void>;
  updateGameRecord(record: LadderGameRecord): Promise<void>;
  updateGameRecordControlScheme(
    gameId: GameId,
    controlScheme: CharacterControlScheme
  ): Promise<void>;
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

  // read side (CQRS-style). id-keyed …Entry results; the LadderQueries impl resolves usernames and
  // assembles the client-facing …View. race + ironman record floor clears; progression does not.
  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<RankedFloorClearEntry>>;

  getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearEntry>>;

  // one clear on its own, for its linkable page. unranked: it was not read off any board
  findFloorClearById(id: LadderPartyFloorClearRecordId): Promise<FloorClearEntry | undefined>;

  // where the given clears stand on the cumulative board, without materializing the board itself.
  // ids that are not on it are absent from the result rather than reported as some sentinel rank
  getCumulativeClearRanks(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<Record<LadderPartyFloorClearRecordId, number>>;

  // the same question asked of the boards for a clear's own floor, which it sits on under both sort
  // fields at once — so both ranks come back together rather than costing a query each. undefined
  // when the clear is on no board, as an absent id is above
  getFloorClearTimeRanks(
    id: LadderPartyFloorClearRecordId
  ): Promise<FloorClearTimeRanks | undefined>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateEntry>>;

  getPlayerProfileData(userId: IdentityProviderId): Promise<PlayerProfileData | undefined>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;
}

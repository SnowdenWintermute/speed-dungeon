import {
  CombatantId,
  GameId,
  GameName,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  Milliseconds,
  PartyId,
} from "../../aliases.js";
import { DateRange } from "../../primatives/date-range.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { LadderPage } from "../queries/ladder-page.js";
import { FloorClear, FloorClearTimesQuery } from "../queries/floor-clear-times.js";
import { WinRateLadderQuery } from "../queries/win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "../queries/character-floor-clear-snapshot.js";
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

// id-keyed read intermediates returned by the read-side query methods. named …Entry (not …Row) to
// stay clear of the DB repos' literal SQL-row types (…RecordRow). the LadderQueries implementation
// resolves IdentityProviderId -> Username (differently online vs offline), joins the XP sorted-set
// for the experience facet, and maps these onto the corresponding client-facing …View. these carry
// ids, never usernames.

// the persistence read side keys players by id; the client-facing FloorClearView keys them by
// Username. both are FloorClear<…> so they share every other field and can't drift — see
// floor-clear-times.ts. FloorClearCharacter (identical either side) is shared directly.
export type FloorClearEntry = FloorClear<IdentityProviderId>;

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

export interface PlayerProfileData {
  participantId: IdentityProviderId;
  rankedRaceTally: WinLossTally;
  personalBestFloorClears: FloorClearEntry[];
}

// the ladder-records half of an experience-ladder entry. experience itself lives in the sorted-set
// (CharacterLevelLadderService), which the LadderQueries impl joins on characterId; this hydrates
// the denormalized character context around it. mode/controlScheme come from the game.
export interface ExperiencePointsLadderCharacterEntry {
  characterId: CombatantId;
  characterName: string;
  ownerId: IdentityProviderId;
  mainClass: { combatantClass: CombatantClass; level: number };
  supportClassOption?: { combatantClass: CombatantClass; level: number };
  mode: GameMode;
  controlScheme: CharacterControlScheme;
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
  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearEntry>>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateEntry>>;

  getPlayerProfileData(userId: IdentityProviderId): Promise<PlayerProfileData | undefined>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  // hydrates the character-record context for an already-ranked page of characterIds (the ranking +
  // paging is driven by the XP sorted-set upstream). returns only ids that resolve, in input order.
  getExperiencePointsLadderCharacters(
    characterIds: CombatantId[]
  ): Promise<ExperiencePointsLadderCharacterEntry[]>;
}

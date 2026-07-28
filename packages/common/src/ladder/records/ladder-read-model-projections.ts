import {
  CombatantId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  PartyId,
} from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import {
  FloorClearSnapshotRef,
  LadderCharacterFloorClearRecord,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  PartyFateType,
} from "./index.js";
import {
  FloorClearEntry,
  PlayerProfileData,
  RankedFloorClearEntry,
  WinLossTally,
  WinRateEntry,
} from "./ladder-records-persistence-strategy.js";
import { LadderPage, PagedLadderQuery, pageSizeOf, totalPagesOf } from "../queries/ladder-page.js";
import {
  CumulativeClearTimesQuery,
  DEFAULT_FLOOR_CLEAR_SORT,
  FloorClearCharacter,
  FloorClearSortField,
  FloorClearTimesQuery,
} from "../queries/floor-clear-times.js";
import { WinRateLadderQuery } from "../queries/win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "../queries/character-floor-clear-snapshot.js";

// pure read-side projections shared by every LadderRecordsPersistenceStrategy implementation. each
// takes plain record arrays (the adapter loads them however it likes — Maps, SQL) and returns the
// id-keyed …Entry read models. keeping the subtle bits (race-winner resolution, win/loss tallying,
// personal-best grouping) here means the in-memory and Postgres strategies can never diverge on them.

export interface FloorClearProjectionRecords {
  partyFloorClears: LadderPartyFloorClearRecord[];
  parties: LadderPartyRecord[];
  games: LadderGameRecord[];
  characters: LadderCharacterRecord[];
  snapshots: FloorClearSnapshotRef[];
}

export function projectFloorClearTimesPage(
  query: FloorClearTimesQuery,
  records: FloorClearProjectionRecords
): LadderPage<RankedFloorClearEntry> {
  const indexes = indexFloorClearRecords(records);

  const matching = records.partyFloorClears.filter((partyFloorClear) => {
    if (partyFloorClear.floor !== query.floor) {
      return false;
    }
    if (
      query.controlSchemeOption !== undefined &&
      partyFloorClear.controlScheme !== query.controlSchemeOption
    ) {
      return false;
    }
    const game = gameForPartyFloorClear(partyFloorClear, indexes);
    if (game === undefined) {
      return false;
    }
    return query.modeOption === undefined || game.mode === query.modeOption;
  });

  const sort = query.sortOption ?? DEFAULT_FLOOR_CLEAR_SORT;
  const ranked = matching.map((partyFloorClear) => ({
    partyFloorClear,
    cumulativeTime: cumulativeTimeFromIndexes(partyFloorClear, indexes),
  }));

  // the id tie-break stays ascending whichever way the chosen column points, so a descending sort is
  // a mirror of the ascending one rather than a differently-tied ordering
  ranked.sort((a, b) => {
    const comparison = compareFloorClearsBy(a, b, sort.field);
    const directed = sort.isDescending ? -comparison : comparison;
    return directed || compareIds(a.partyFloorClear.id, b.partyFloorClear.id);
  });

  return paginate(ranked, query, ({ partyFloorClear }, rank) => ({
    rank,
    ...assembleFloorClear(partyFloorClear, indexes),
  }));
}

// ordinal, not localeCompare: Postgres orders these ids by their own value, and locale-aware
// comparison can disagree with that on punctuation. the two strategies must tie-break alike
function compareIds(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

function compareFloorClearsBy(
  a: { partyFloorClear: LadderPartyFloorClearRecord; cumulativeTime: number },
  b: { partyFloorClear: LadderPartyFloorClearRecord; cumulativeTime: number },
  field: FloorClearSortField
): number {
  switch (field) {
    case FloorClearSortField.TimeSpentOnFloor:
      return a.partyFloorClear.timeSpentOnFloor - b.partyFloorClear.timeSpentOnFloor;
    case FloorClearSortField.CumulativeTimeToClearFloor:
      return a.cumulativeTime - b.cumulativeTime;
  }
}

export function projectCumulativeClearTimesPage(
  query: CumulativeClearTimesQuery,
  records: FloorClearProjectionRecords
): LadderPage<RankedFloorClearEntry> {
  const indexes = indexFloorClearRecords(records);
  const ranked = rankCumulativeClears(query.controlScheme, records, indexes);

  return paginate(ranked, query, ({ partyFloorClear }, rank) => ({
    rank,
    ...assembleFloorClear(partyFloorClear, indexes),
  }));
}

// what rank the given clears hold on their own scheme's board. a clear names the board it is on, so
// the ids may span both schemes and each is ranked against its own
export function projectCumulativeClearRanks(
  ids: LadderPartyFloorClearRecordId[],
  records: FloorClearProjectionRecords
): Record<LadderPartyFloorClearRecordId, number> {
  const indexes = indexFloorClearRecords(records);
  const wanted = new Set(ids);
  const schemes = new Set(
    records.partyFloorClears
      .filter((partyFloorClear) => wanted.has(partyFloorClear.id))
      .map((partyFloorClear) => partyFloorClear.controlScheme)
  );

  const ranksById: Record<LadderPartyFloorClearRecordId, number> = {};
  for (const controlScheme of schemes) {
    rankCumulativeClears(controlScheme, records, indexes).forEach(({ partyFloorClear }, index) => {
      if (wanted.has(partyFloorClear.id)) {
        ranksById[partyFloorClear.id] = index + 1;
      }
    });
  }
  return ranksById;
}

// the board's ordering, shared by the page and the rank lookups so a row cannot be told one rank when
// it is read off the board and another when it is asked about
function rankCumulativeClears(
  controlScheme: CharacterControlScheme,
  records: FloorClearProjectionRecords,
  indexes: FloorClearIndexes
) {
  // cumulative time is computed once per clear rather than inside the comparator, which would
  // re-sum a party's whole history on every comparison
  const ranked = records.partyFloorClears
    .filter((partyFloorClear) => {
      if (partyFloorClear.controlScheme !== controlScheme) {
        return false;
      }
      return gameForPartyFloorClear(partyFloorClear, indexes) !== undefined;
    })
    .map((partyFloorClear) => ({
      partyFloorClear,
      cumulativeTime: cumulativeTimeFromIndexes(partyFloorClear, indexes),
    }));

  // deepest first, then fastest to get there. the id tie-break keeps the in-memory strategy a
  // faithful oracle for the SQL one, whose row order is otherwise unspecified
  ranked.sort(
    (a, b) =>
      b.partyFloorClear.floor - a.partyFloorClear.floor ||
      a.cumulativeTime - b.cumulativeTime ||
      compareIds(a.partyFloorClear.id, b.partyFloorClear.id)
  );

  return ranked;
}

// the single clear behind its own linkable page. the caller loads the clear's party history for the
// cumulative sum exactly as a board would, so the numbers on this page match the row it was reached
// from — everything but rank, which only a board can say
export function projectFloorClearById(
  partyFloorClearId: LadderPartyFloorClearRecordId,
  records: FloorClearProjectionRecords
): FloorClearEntry | undefined {
  const partyFloorClear = records.partyFloorClears.find(
    (candidate) => candidate.id === partyFloorClearId
  );
  const indexes = indexFloorClearRecords(records);
  if (
    partyFloorClear === undefined ||
    gameForPartyFloorClear(partyFloorClear, indexes) === undefined
  ) {
    return undefined;
  }
  return assembleFloorClear(partyFloorClear, indexes);
}

// for strategies that already filtered, ordered and sliced in storage: assembles the given rows in
// the order handed over, without re-sorting. every displayed figure — cumulative time included —
// still comes from this shared assembly, so a storage-side ordering can only ever disagree about
// order, never about the numbers on a row. records.partyFloorClears is the page's parties' full
// clear history, which cumulativeTimeToClearFloor sums over.
export function assembleFloorClearPage(
  orderedPageClears: LadderPartyFloorClearRecord[],
  query: PagedLadderQuery,
  totalEntries: number,
  records: FloorClearProjectionRecords
): LadderPage<RankedFloorClearEntry> {
  const indexes = indexFloorClearRecords(records);
  const { page } = query;
  const pageSize = pageSizeOf(query);
  const pageStart = page * pageSize;

  return {
    page,
    totalPages: totalPagesOf(totalEntries, pageSize),
    entries: orderedPageClears.map((partyFloorClear, indexInPage) => ({
      rank: pageStart + indexInPage + 1,
      ...assembleFloorClear(partyFloorClear, indexes),
    })),
  };
}

export function projectWinRateLadderPage(
  query: WinRateLadderQuery,
  records: {
    participantIds: IdentityProviderId[];
    games: LadderGameRecord[];
    parties: LadderPartyRecord[];
    characters: LadderCharacterRecord[];
  }
): LadderPage<WinRateEntry> {
  const tallied = records.participantIds
    .map((participantId) => ({
      participantId,
      tally: computeRankedRaceTally(
        participantId,
        records.games,
        records.parties,
        records.characters,
        query.controlSchemeOption
      ),
    }))
    .filter((entry) => entry.tally.gamesPlayed >= query.minimumGamesPlayed);

  tallied.sort(
    (a, b) => winRateOf(b.tally) - winRateOf(a.tally) || b.tally.gamesPlayed - a.tally.gamesPlayed
  );

  return paginate(tallied, query, (entry, rank) => ({
    rank,
    participantId: entry.participantId,
    tally: entry.tally,
  }));
}

// convenience over the whole record bag, used by the in-memory strategy where everything is already
// in RAM. the Postgres strategy instead composes the pieces below (computeRankedRaceTally +
// selectPersonalBestPartyFloorClears + assemblePersonalBestEntries) so it can load the heavy
// snapshot blobs only for the user's actual personal-best clears, never for rival parties.
export function projectPlayerProfileData(
  userId: IdentityProviderId,
  records: FloorClearProjectionRecords & { isKnownParticipant: boolean }
): PlayerProfileData | undefined {
  if (!records.isKnownParticipant) {
    return undefined;
  }
  const rankedRaceTally = computeRankedRaceTally(
    userId,
    records.games,
    records.parties,
    records.characters
  );
  const userPartyIds = new Set(
    records.characters
      .filter((character) => character.controllingPlayerId === userId)
      .map((character) => character.partyRecordId)
  );
  const userPartyFloorClears = records.partyFloorClears.filter((partyFloorClear) =>
    userPartyIds.has(partyFloorClear.partyRecordRef)
  );
  const assemblyRecords = {
    parties: records.parties,
    games: records.games,
    characters: records.characters,
    snapshots: records.snapshots,
    partyClearHistory: records.partyFloorClears,
  };
  const selectionRecords = {
    parties: records.parties,
    games: records.games,
    partyClearHistory: records.partyFloorClears,
  };

  return {
    participantId: userId,
    rankedRaceTally,
    personalBestFloorTimes: assemblePersonalBestEntries(
      selectPersonalBestPartyFloorClears(
        userPartyFloorClears,
        selectionRecords,
        FloorClearSortField.TimeSpentOnFloor
      ),
      assemblyRecords
    ),
    personalBestCumulativeTimes: assemblePersonalBestEntries(
      selectPersonalBestPartyFloorClears(
        userPartyFloorClears,
        selectionRecords,
        FloorClearSortField.CumulativeTimeToClearFloor
      ),
      assemblyRecords
    ),
  };
}

// the user's best clear per (floor, mode, control scheme), sorted by floor. inputs are expected
// to be pre-scoped to the user's own clears — this does not itself check party membership.
// which time counts as "best" is the caller's, because a run that took a floor fastest is often not
// the run that got there fastest: the cumulative figure is the whole descent up to that floor, so a
// slow floor in a fast run can still be the best cumulative time the player has.
// the clear history is the *party's*, deliberately including floors cleared under the other control
// scheme, as everywhere else cumulative time is summed — a party can switch mid-run
export function selectPersonalBestPartyFloorClears(
  userPartyFloorClears: LadderPartyFloorClearRecord[],
  records: {
    parties: LadderPartyRecord[];
    games: LadderGameRecord[];
    partyClearHistory: LadderPartyFloorClearRecord[];
  },
  bestBy: FloorClearSortField
): LadderPartyFloorClearRecord[] {
  const partiesById = new Map(records.parties.map((party) => [party.id, party]));
  const gamesById = new Map(records.games.map((game) => [game.id, game]));
  const clearsByParty = new Map<PartyId, LadderPartyFloorClearRecord[]>();
  for (const clear of records.partyClearHistory) {
    const partyClears = clearsByParty.get(clear.partyRecordRef) ?? [];
    partyClears.push(clear);
    clearsByParty.set(clear.partyRecordRef, partyClears);
  }

  function timeOf(partyFloorClear: LadderPartyFloorClearRecord): number {
    if (bestBy === FloorClearSortField.TimeSpentOnFloor) {
      return partyFloorClear.timeSpentOnFloor;
    }
    return cumulativeTimeToClearFloor(
      partyFloorClear,
      clearsByParty.get(partyFloorClear.partyRecordRef) ?? []
    );
  }

  const bestByFloorModeScheme = new Map<string, LadderPartyFloorClearRecord>();

  for (const partyFloorClear of userPartyFloorClears) {
    const party = partiesById.get(partyFloorClear.partyRecordRef);
    const game = party === undefined ? undefined : gamesById.get(party.gameRecordId);
    if (game === undefined) {
      continue;
    }
    const key = `${partyFloorClear.floor}:${game.mode}:${partyFloorClear.controlScheme}`;
    const current = bestByFloorModeScheme.get(key);
    if (current === undefined || timeOf(partyFloorClear) < timeOf(current)) {
      bestByFloorModeScheme.set(key, partyFloorClear);
    }
  }

  return [...bestByFloorModeScheme.values()].sort((a, b) => a.floor - b.floor);
}

// assembles the display entries for an already-selected, floor-sorted set of best clears
export function assemblePersonalBestEntries(
  bestPartyFloorClears: LadderPartyFloorClearRecord[],
  records: {
    parties: LadderPartyRecord[];
    games: LadderGameRecord[];
    characters: LadderCharacterRecord[];
    snapshots: FloorClearSnapshotRef[];
    // the best clears' parties' full clear history (floors <= each best), for cumulativeTimeToClearFloor
    partyClearHistory: LadderPartyFloorClearRecord[];
  }
): FloorClearEntry[] {
  const indexes = indexFloorClearRecords({
    partyFloorClears: records.partyClearHistory,
    parties: records.parties,
    games: records.games,
    characters: records.characters,
    snapshots: records.snapshots,
  });
  return bestPartyFloorClears.map((partyFloorClear) =>
    assembleFloorClear(partyFloorClear, indexes)
  );
}

export function projectCharacterFloorClearSnapshot(
  snapshot: LadderCharacterFloorClearRecord | undefined,
  characterName: string
): CharacterFloorClearSnapshotView | undefined {
  if (snapshot === undefined) {
    return undefined;
  }
  return {
    id: snapshot.id,
    characterRecordId: snapshot.characterRecordRef,
    characterName,
    combatantSchemaVersion: snapshot.combatantSchemaVersion,
    combatantWithPets: snapshot.combatantWithPets,
  };
}

// race winner(s) = the party (or tied parties) with the earliest escape timestamp in the game
export function raceWinnerPartyIds(parties: LadderPartyRecord[], gameId: GameId): Set<PartyId> {
  const escaped: { id: PartyId; timestamp: number }[] = [];
  for (const party of parties) {
    if (party.gameRecordId !== gameId) {
      continue;
    }
    const fate = party.fateOption;
    if (fate !== undefined && fate.type === PartyFateType.Escape) {
      escaped.push({ id: party.id, timestamp: fate.timestamp });
    }
  }
  if (escaped.length === 0) {
    return new Set();
  }
  const earliest = Math.min(...escaped.map((entry) => entry.timestamp));
  return new Set(escaped.filter((entry) => entry.timestamp === earliest).map((entry) => entry.id));
}

export function computeRankedRaceTally(
  userId: IdentityProviderId,
  games: LadderGameRecord[],
  parties: LadderPartyRecord[],
  characters: LadderCharacterRecord[],
  controlSchemeOption?: CharacterControlScheme
): WinLossTally {
  let wins = 0;
  let gamesPlayed = 0;
  for (const game of games) {
    if (game.mode !== GameMode.RankedRace) {
      continue;
    }
    if (controlSchemeOption !== undefined && game.controlScheme !== controlSchemeOption) {
      continue;
    }
    const party = playerPartyInGame(game.id, userId, parties, characters);
    if (party === undefined || party.fateOption === undefined) {
      continue;
    }
    gamesPlayed += 1;
    if (raceWinnerPartyIds(parties, game.id).has(party.id)) {
      wins += 1;
    }
  }
  return { wins, losses: gamesPlayed - wins, gamesPlayed };
}

interface FloorClearIndexes {
  partiesById: Map<PartyId, LadderPartyRecord>;
  gamesById: Map<GameId, LadderGameRecord>;
  charactersByParty: Map<PartyId, LadderCharacterRecord[]>;
  partyFloorClearsByParty: Map<PartyId, LadderPartyFloorClearRecord[]>;
  // keyed by clear + character rather than scanned per assembled row: the ref list covers every
  // clear on the board, so a linear find here is a full pass over it for each character of each row
  snapshotIdByClearAndCharacter: Map<string, LadderCharacterFloorClearRecordId>;
}

function snapshotKey(
  partyFloorClearRecordId: LadderPartyFloorClearRecordId,
  characterRecordId: CombatantId
): string {
  return `${partyFloorClearRecordId}:${characterRecordId}`;
}

function indexFloorClearRecords(records: FloorClearProjectionRecords): FloorClearIndexes {
  const charactersByParty = new Map<PartyId, LadderCharacterRecord[]>();
  for (const character of records.characters) {
    const forParty = charactersByParty.get(character.partyRecordId) ?? [];
    forParty.push(character);
    charactersByParty.set(character.partyRecordId, forParty);
  }
  const partyFloorClearsByParty = new Map<PartyId, LadderPartyFloorClearRecord[]>();
  for (const partyFloorClear of records.partyFloorClears) {
    const forParty = partyFloorClearsByParty.get(partyFloorClear.partyRecordRef) ?? [];
    forParty.push(partyFloorClear);
    partyFloorClearsByParty.set(partyFloorClear.partyRecordRef, forParty);
  }
  return {
    partiesById: new Map(records.parties.map((party) => [party.id, party])),
    gamesById: new Map(records.games.map((game) => [game.id, game])),
    charactersByParty,
    partyFloorClearsByParty,
    snapshotIdByClearAndCharacter: new Map(
      records.snapshots.map((snapshot) => [
        snapshotKey(snapshot.partyFloorClearRecord, snapshot.characterRecordRef),
        snapshot.id,
      ])
    ),
  };
}

// active time from game start through clearing the given floor: sum of timeSpentOnFloor over the
// party's clears on floors <= this one. floors 1..X are expected to all be present (an invariant — a
// gap means a floor clear went unrecorded, i.e. a write-path bug); we sum whatever exists.
export function cumulativeTimeToClearFloor(
  partyFloorClear: LadderPartyFloorClearRecord,
  partyClears: LadderPartyFloorClearRecord[]
): number {
  return partyClears
    .filter((clear) => clear.floor <= partyFloorClear.floor)
    .reduce((total, clear) => total + clear.timeSpentOnFloor, 0);
}

function cumulativeTimeFromIndexes(
  partyFloorClear: LadderPartyFloorClearRecord,
  indexes: FloorClearIndexes
): number {
  return cumulativeTimeToClearFloor(
    partyFloorClear,
    indexes.partyFloorClearsByParty.get(partyFloorClear.partyRecordRef) ?? []
  );
}

function gameForPartyFloorClear(
  partyFloorClear: LadderPartyFloorClearRecord,
  indexes: FloorClearIndexes
): LadderGameRecord | undefined {
  const party = indexes.partiesById.get(partyFloorClear.partyRecordRef);
  if (party === undefined) {
    return undefined;
  }
  return indexes.gamesById.get(party.gameRecordId);
}

function assembleFloorClear(
  partyFloorClear: LadderPartyFloorClearRecord,
  indexes: FloorClearIndexes
): FloorClearEntry {
  const party = indexes.partiesById.get(partyFloorClear.partyRecordRef);
  const game = party === undefined ? undefined : indexes.gamesById.get(party.gameRecordId);
  // callers only assemble entries for floor clears that passed the game-resolution filter
  if (party === undefined || game === undefined) {
    throw new Error("cannot assemble a floor clear entry without its party and game");
  }

  const partyCharacters = indexes.charactersByParty.get(party.id) ?? [];

  const characters: FloorClearCharacter<IdentityProviderId>[] = partyCharacters.map((character) => {
    return {
      characterId: character.id,
      characterName: character.name,
      snapshotIdOption: indexes.snapshotIdByClearAndCharacter.get(
        snapshotKey(partyFloorClear.id, character.id)
      ),
      mainClass: character.mainClass,
      supportClassOption: character.supportClassOption,
      owner: character.controllingPlayerId,
    };
  });

  const players = [...new Set(partyCharacters.map((character) => character.controllingPlayerId))];

  return {
    id: partyFloorClear.id,
    gameRecordId: game.id,
    partyRecordId: party.id,
    partyName: party.name,
    mode: game.mode,
    controlScheme: partyFloorClear.controlScheme,
    floor: partyFloorClear.floor,
    timeSpentOnFloor: partyFloorClear.timeSpentOnFloor,
    cumulativeTimeToClearFloor: cumulativeTimeFromIndexes(partyFloorClear, indexes),
    gameStartedAt: game.timeStarted,
    clearedAt: partyFloorClear.clearedAt,
    players,
    characters,
  };
}

function playerPartyInGame(
  gameId: GameId,
  userId: IdentityProviderId,
  parties: LadderPartyRecord[],
  characters: LadderCharacterRecord[]
): LadderPartyRecord | undefined {
  const partiesById = new Map(parties.map((party) => [party.id, party]));
  for (const character of characters) {
    if (character.controllingPlayerId !== userId) {
      continue;
    }
    const party = partiesById.get(character.partyRecordId);
    if (party !== undefined && party.gameRecordId === gameId) {
      return party;
    }
  }
  return undefined;
}

export function winRateOf(tally: WinLossTally): number {
  return tally.gamesPlayed === 0 ? 0 : tally.wins / tally.gamesPlayed;
}

function paginate<TSource, TEntry>(
  all: TSource[],
  query: PagedLadderQuery,
  toEntry: (source: TSource, rank: number) => TEntry
): LadderPage<TEntry> {
  const { page } = query;
  const pageSize = pageSizeOf(query);
  const totalPages = totalPagesOf(all.length, pageSize);
  const pageStart = page * pageSize;
  const pageSources = all.slice(pageStart, pageStart + pageSize);
  const entries = pageSources.map((source, indexInPage) =>
    toEntry(source, pageStart + indexInPage + 1)
  );
  return { page, totalPages, entries };
}

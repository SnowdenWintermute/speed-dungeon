import {
  CombatantId,
  GameId,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  PartyId,
} from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { compareStringsOrdinally, invariant } from "../../utils/index.js";
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
  FloorClearTimeRanks,
  FloorClearTimesQuery,
} from "../queries/floor-clear-times.js";
import { WinRateLadderQuery } from "../queries/win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "../queries/character-floor-clear-snapshot.js";

// pure read-side assembly shared by every LadderRecordsPersistenceStrategy implementation. each
// function takes plain record arrays (the adapter loads them however it likes — Maps, SQL) and
// returns the id-keyed …Entry read models. keeping the subtle bits (race-winner resolution, win/loss
// tallying, personal-best grouping) here means the two strategies can never diverge on them.
// three verbs, and they mean different things: assemble… returns a read model, select… returns the
// records that won, compute… returns a figure

// picking which clears are a player's personal bests needs no characters and no snapshots: it reads
// each clear's game (for the mode) and its party's other clears (for the running total). stated as a
// subset so a caller holding the full set can pass it straight in, and so the postgres strategy can
// select first and only then load the snapshot blobs for the handful that won
export type PersonalBestSelectionRecords = Pick<
  FloorClearAssemblyRecords,
  "parties" | "games" | "partyFloorClears"
>;

// the records needed to describe a floor clear: its party, that party's game and characters, the
// snapshots taken at it, and the party's other clears for the running total. a query loads whichever
// slice of these its rows need — the slice spans games, since a board's rows come from many runs
export interface FloorClearAssemblyRecords {
  partyFloorClears: LadderPartyFloorClearRecord[];
  parties: LadderPartyRecord[];
  games: LadderGameRecord[];
  characters: LadderCharacterRecord[];
  snapshots: FloorClearSnapshotRef[];
}

export function assembleFloorClearTimesPage(
  query: FloorClearTimesQuery,
  records: FloorClearAssemblyRecords
): LadderPage<RankedFloorClearEntry> {
  const assembler = new FloorClearAssembler(records);

  const matching = assembler.clears.filter((partyFloorClear) => {
    if (partyFloorClear.floor !== query.floor) {
      return false;
    }
    if (
      query.controlSchemeOption !== undefined &&
      partyFloorClear.controlScheme !== query.controlSchemeOption
    ) {
      return false;
    }
    const gameOption = assembler.gameFor(partyFloorClear);
    if (gameOption === undefined) {
      return false;
    }
    return query.modeOption === undefined || gameOption.mode === query.modeOption;
  });

  const sort = query.sortOption ?? DEFAULT_FLOOR_CLEAR_SORT;
  const ranked = matching.map((partyFloorClear) => assembler.withCumulativeTime(partyFloorClear));

  // the id tie-break stays ascending whichever way the chosen column points, so a descending sort is
  // a mirror of the ascending one rather than a differently-tied ordering
  ranked.sort((a, b) => {
    const comparison = compareFloorClearsBy(a, b, sort.field);
    const directed = sort.isDescending ? -comparison : comparison;
    return directed || compareStringsOrdinally(a.partyFloorClear.id, b.partyFloorClear.id);
  });

  return paginate(ranked, query, ({ partyFloorClear }, rank) => ({
    rank,
    ...assembler.assemble(partyFloorClear),
  }));
}

function compareFloorClearsBy(
  a: TimedFloorClear,
  b: TimedFloorClear,
  field: FloorClearSortField
): number {
  switch (field) {
    case FloorClearSortField.TimeSpentOnFloor:
      return a.partyFloorClear.timeSpentOnFloor - b.partyFloorClear.timeSpentOnFloor;
    case FloorClearSortField.CumulativeTimeToClearFloor:
      return a.cumulativeTime - b.cumulativeTime;
  }
}

export function assembleCumulativeClearTimesPage(
  query: CumulativeClearTimesQuery,
  records: FloorClearAssemblyRecords
): LadderPage<RankedFloorClearEntry> {
  const assembler = new FloorClearAssembler(records);

  return paginate(
    assembler.rankedByCumulative(query.controlScheme),
    query,
    ({ partyFloorClear }, rank) => ({ rank, ...assembler.assemble(partyFloorClear) })
  );
}

// what rank the given clears hold on their own scheme's board. a clear names the board it is on, so
// the ids may span both schemes and each is ranked against its own
export function computeCumulativeClearRanks(
  ids: LadderPartyFloorClearRecordId[],
  records: FloorClearAssemblyRecords
): Record<LadderPartyFloorClearRecordId, number> {
  const assembler = new FloorClearAssembler(records);
  const wanted = new Set(ids);
  const schemes = new Set(
    assembler.clears
      .filter((partyFloorClear) => wanted.has(partyFloorClear.id))
      .map((partyFloorClear) => partyFloorClear.controlScheme)
  );

  const ranksById: Record<LadderPartyFloorClearRecordId, number> = {};
  for (const controlScheme of schemes) {
    assembler.rankedByCumulative(controlScheme).forEach(({ partyFloorClear }, index) => {
      if (wanted.has(partyFloorClear.id)) {
        ranksById[partyFloorClear.id] = index + 1;
      }
    });
  }
  return ranksById;
}

// what rank one clear holds on the boards for its own floor — the clear names those boards itself,
// through the floor and scheme it was made under
export function computeFloorClearTimeRanks(
  id: LadderPartyFloorClearRecordId,
  records: FloorClearAssemblyRecords
): FloorClearTimeRanks | undefined {
  const assembler = new FloorClearAssembler(records);
  const targetOption = assembler.clears.find((partyFloorClear) => partyFloorClear.id === id);
  if (targetOption === undefined || !assembler.isOnABoard(targetOption)) {
    return undefined;
  }

  return {
    [FloorClearSortField.TimeSpentOnFloor]: assembler.rankOnFloorBoard(
      targetOption,
      FloorClearSortField.TimeSpentOnFloor
    ),
    [FloorClearSortField.CumulativeTimeToClearFloor]: assembler.rankOnFloorBoard(
      targetOption,
      FloorClearSortField.CumulativeTimeToClearFloor
    ),
  };
}

// the single clear behind its own linkable page. the caller loads the clear's party history for the
// cumulative sum exactly as a board would, so the numbers on this page match the row it was reached
// from — everything but rank, which only a board can say
export function assembleFloorClearById(
  partyFloorClearId: LadderPartyFloorClearRecordId,
  records: FloorClearAssemblyRecords
): FloorClearEntry | undefined {
  const assembler = new FloorClearAssembler(records);
  const partyFloorClearOption = assembler.clears.find(
    (candidate) => candidate.id === partyFloorClearId
  );
  if (partyFloorClearOption === undefined || !assembler.isOnABoard(partyFloorClearOption)) {
    return undefined;
  }
  return assembler.assemble(partyFloorClearOption);
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
  records: FloorClearAssemblyRecords
): LadderPage<RankedFloorClearEntry> {
  const assembler = new FloorClearAssembler(records);
  const { page } = query;
  const pageSize = pageSizeOf(query);
  const pageStart = page * pageSize;

  return {
    page,
    totalPages: totalPagesOf(totalEntries, pageSize),
    entries: orderedPageClears.map((partyFloorClear, indexInPage) => ({
      rank: pageStart + indexInPage + 1,
      ...assembler.assemble(partyFloorClear),
    })),
  };
}

export function assembleWinRateLadderPage(
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
export function assemblePlayerProfileData(
  userId: IdentityProviderId,
  records: FloorClearAssemblyRecords
): PlayerProfileData {
  const userPartyIds = new Set(
    records.characters
      .filter((character) => character.controllingPlayerId === userId)
      .map((character) => character.partyRecordId)
  );
  const userPartyFloorClears = records.partyFloorClears.filter((partyFloorClear) =>
    userPartyIds.has(partyFloorClear.partyRecordRef)
  );
  const personalBestsBy = (bestBy: FloorClearSortField) =>
    assemblePersonalBestEntries(
      selectPersonalBestPartyFloorClears(userPartyFloorClears, records, bestBy),
      records
    );

  return {
    participantId: userId,
    rankedRaceTally: computeRankedRaceTally(
      userId,
      records.games,
      records.parties,
      records.characters
    ),
    personalBestFloorTimes: personalBestsBy(FloorClearSortField.TimeSpentOnFloor),
    personalBestCumulativeTimes: personalBestsBy(
      FloorClearSortField.CumulativeTimeToClearFloor
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
  records: PersonalBestSelectionRecords,
  bestBy: FloorClearSortField
): LadderPartyFloorClearRecord[] {
  const partiesById = new Map(records.parties.map((party) => [party.id, party]));
  const gamesById = new Map(records.games.map((game) => [game.id, game]));
  const clearsByParty = new Map<PartyId, LadderPartyFloorClearRecord[]>();
  for (const clear of records.partyFloorClears) {
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

// assembles the display entries for an already-selected, floor-sorted set of best clears.
// partyFloorClears here is the best clears' parties' full history, not just the winning clears —
// the running total on each row sums every floor below it
export function assemblePersonalBestEntries(
  bestPartyFloorClears: LadderPartyFloorClearRecord[],
  records: FloorClearAssemblyRecords
): FloorClearEntry[] {
  const assembler = new FloorClearAssembler(records);
  return bestPartyFloorClears.map((partyFloorClear) => assembler.assemble(partyFloorClear));
}

export function assembleCharacterFloorClearSnapshot(
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

// a clear paired with the running total it is ranked by, computed once rather than inside a
// comparator that would re-sum the party's history on every comparison
interface TimedFloorClear {
  partyFloorClear: LadderPartyFloorClearRecord;
  cumulativeTime: number;
}

// the loaded records for one query, with the relationships between them resolved. the slice spans
// games — a board's rows come from as many different runs as it has rows — so a clear finds its own
// game by two hops, clear -> party -> game, rather than being handed one. those hops are the joins
// the Postgres strategy writes as SQL, which is why both strategies have to agree here.
// built per query and discarded with it; nothing in here outlives the call
export class FloorClearAssembler {
  private readonly partiesById: Map<PartyId, LadderPartyRecord>;
  private readonly gamesById: Map<GameId, LadderGameRecord>;
  private readonly charactersByParty = new Map<PartyId, LadderCharacterRecord[]>();
  private readonly clearsByParty = new Map<PartyId, LadderPartyFloorClearRecord[]>();
  // keyed by clear + character rather than scanned per assembled row: the ref list covers every
  // clear on the board, so a linear find here is a full pass over it for each character of each row
  private readonly snapshotIdByClearAndCharacter: Map<string, LadderCharacterFloorClearRecordId>;

  constructor(private readonly records: FloorClearAssemblyRecords) {
    for (const character of records.characters) {
      const forParty = this.charactersByParty.get(character.partyRecordId) ?? [];
      forParty.push(character);
      this.charactersByParty.set(character.partyRecordId, forParty);
    }
    for (const partyFloorClear of records.partyFloorClears) {
      const forParty = this.clearsByParty.get(partyFloorClear.partyRecordRef) ?? [];
      forParty.push(partyFloorClear);
      this.clearsByParty.set(partyFloorClear.partyRecordRef, forParty);
    }
    this.partiesById = new Map(records.parties.map((party) => [party.id, party]));
    this.gamesById = new Map(records.games.map((game) => [game.id, game]));
    this.snapshotIdByClearAndCharacter = new Map(
      records.snapshots.map((snapshot) => [
        snapshotKey(snapshot.partyFloorClearRecord, snapshot.characterRecordRef),
        snapshot.id,
      ])
    );
  }

  get clears(): LadderPartyFloorClearRecord[] {
    return this.records.partyFloorClears;
  }

  gameFor(partyFloorClear: LadderPartyFloorClearRecord): LadderGameRecord | undefined {
    const partyOption = this.partiesById.get(partyFloorClear.partyRecordRef);
    if (partyOption === undefined) {
      return undefined;
    }
    return this.gamesById.get(partyOption.gameRecordId);
  }

  // a clear whose party or game did not come back with the slice cannot be described, so it is not on
  // any board rather than being shown with pieces missing
  isOnABoard(partyFloorClear: LadderPartyFloorClearRecord): boolean {
    return this.gameFor(partyFloorClear) !== undefined;
  }

  cumulativeTimeFor(partyFloorClear: LadderPartyFloorClearRecord): number {
    return cumulativeTimeToClearFloor(
      partyFloorClear,
      this.clearsByParty.get(partyFloorClear.partyRecordRef) ?? []
    );
  }

  withCumulativeTime(partyFloorClear: LadderPartyFloorClearRecord): TimedFloorClear {
    return { partyFloorClear, cumulativeTime: this.cumulativeTimeFor(partyFloorClear) };
  }

  // the board's ordering, shared by the page and the rank lookups so a row cannot be told one rank
  // when it is read off the board and another when it is asked about.
  // deepest first, then fastest to get there. the id tie-break keeps this a faithful oracle for the
  // SQL one, whose row order is otherwise unspecified
  rankedByCumulative(controlScheme: CharacterControlScheme): TimedFloorClear[] {
    return this.clears
      .filter(
        (partyFloorClear) =>
          partyFloorClear.controlScheme === controlScheme && this.isOnABoard(partyFloorClear)
      )
      .map((partyFloorClear) => this.withCumulativeTime(partyFloorClear))
      .sort(
        (a, b) =>
          b.partyFloorClear.floor - a.partyFloorClear.floor ||
          a.cumulativeTime - b.cumulativeTime ||
          compareStringsOrdinally(a.partyFloorClear.id, b.partyFloorClear.id)
      );
  }

  // a rank counted rather than read off a built board, which is what the SQL strategy does too. only
  // the ascending board is ever ranked against: a position on a slowest-first ordering is not a
  // standing anyone claims. the id tie-break matches the page comparator's, so a clear cannot be told
  // one rank here and another when it is read off the page it falls on
  rankOnFloorBoard(target: LadderPartyFloorClearRecord, field: FloorClearSortField): number {
    const timedTarget = this.withCumulativeTime(target);
    let clearsThatBeatIt = 0;

    for (const partyFloorClear of this.clears) {
      if (
        partyFloorClear.floor !== target.floor ||
        partyFloorClear.controlScheme !== target.controlScheme ||
        !this.isOnABoard(partyFloorClear)
      ) {
        continue;
      }
      const comparison =
        compareFloorClearsBy(this.withCumulativeTime(partyFloorClear), timedTarget, field) ||
        compareStringsOrdinally(partyFloorClear.id, target.id);
      if (comparison < 0) {
        clearsThatBeatIt += 1;
      }
    }

    return clearsThatBeatIt + 1;
  }

  assemble(partyFloorClear: LadderPartyFloorClearRecord): FloorClearEntry {
    // callers only assemble clears that passed isOnABoard, so a missing link here is the slice being
    // loaded wrong rather than a clear that legitimately has no party or game
    const partyOption = this.partiesById.get(partyFloorClear.partyRecordRef);
    invariant(partyOption !== undefined, `no party loaded for floor clear ${partyFloorClear.id}`);
    const gameOption = this.gamesById.get(partyOption.gameRecordId);
    invariant(gameOption !== undefined, `no game loaded for party ${partyOption.id}`);

    const partyCharacters = this.charactersByParty.get(partyOption.id) ?? [];
    const characters: FloorClearCharacter<IdentityProviderId>[] = partyCharacters.map(
      (character) => ({
        characterId: character.id,
        characterName: character.name,
        snapshotIdOption: this.snapshotIdByClearAndCharacter.get(
          snapshotKey(partyFloorClear.id, character.id)
        ),
        mainClass: character.mainClass,
        supportClassOption: character.supportClassOption,
        owner: character.controllingPlayerId,
      })
    );

    return {
      id: partyFloorClear.id,
      gameRecordId: gameOption.id,
      partyRecordId: partyOption.id,
      partyName: partyOption.name,
      mode: gameOption.mode,
      controlScheme: partyFloorClear.controlScheme,
      floor: partyFloorClear.floor,
      timeSpentOnFloor: partyFloorClear.timeSpentOnFloor,
      cumulativeTimeToClearFloor: this.cumulativeTimeFor(partyFloorClear),
      gameStartedAt: gameOption.timeStarted,
      clearedAt: partyFloorClear.clearedAt,
      players: [...new Set(partyCharacters.map((character) => character.controllingPlayerId))],
      characters,
    };
  }
}

function snapshotKey(
  partyFloorClearRecordId: LadderPartyFloorClearRecordId,
  characterRecordId: CombatantId
): string {
  return `${partyFloorClearRecordId}:${characterRecordId}`;
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

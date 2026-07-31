import format from "pg-format";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  CharacterControlScheme,
  DateRange,
  GAME_MODE_STRINGS,
  GameId,
  GameMode,
  GameName,
  IdentityProviderId,
  invariant,
  LadderCharacterFloorClearRecord,
  LadderCharacterFloorClearRecordId,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderGameRecordAggregate,
  LadderParticipantRecord,
  LadderPartyFateUpdate,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  LadderRecordsPersistenceStrategy,
  Milliseconds,
  NewLadderGameRecordSet,
  PartyFateType,
  PartyId,
  USER_GAME_HISTORY_PAGE_SIZE,
  UserGameHistoryEntry,
  Username,
  CharacterFloorClearSnapshotView,
  FloorClearEntry,
  FloorClearAssemblyRecords,
  PersonalBestSelectionRecords,
  RankedFloorClearEntry,
  assembleFloorClearById,
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  LadderPage,
  LadderPartyFloorClearRecordId,
  PlayerProfileData,
  WinRateEntry,
  WinRateLadderQuery,
  assemblePersonalBestEntries,
  computeRankedRaceTally,
  assembleCharacterFloorClearSnapshot,
  assembleFloorClearPage,
  DEFAULT_FLOOR_CLEAR_SORT,
  FloorClearSortField,
  FloorClearTimeRanks,
  PagedLadderQuery,
  pageSizeOf,
  assembleWinRateLadderPage,
  selectPersonalBestPartyFloorClears,
} from "@speed-dungeon/common";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../../database/db-consts.js";
import { toCamelCase } from "../../database/utils.js";
import { timestampToMs } from "../../database/row-conversions.js";
import { ladderGameRecordsRepo } from "../../database/repos/ladder-game-records.js";
import { ladderParticipantRecordsRepo } from "../../database/repos/ladder-participant-records.js";
import { ladderGameParticipationRecordsRepo } from "../../database/repos/ladder-game-participation-records.js";
import { ladderPartyRecordsRepo } from "../../database/repos/ladder-party-records.js";
import { ladderCharacterRecordsRepo } from "../../database/repos/ladder-character-records.js";
import {
  ladderPartyFloorClearRecordsRepo,
  LadderPartyFloorClearRecordRow,
  partyFloorClearRecordFromRow,
} from "../../database/repos/ladder-party-floor-clear-records.js";
import { ladderCharacterFloorClearedRecordsRepo } from "../../database/repos/ladder-character-floor-cleared-records.js";

// the running total has to be computed before any row filter is applied, or the number would silently
// change meaning: a party's cumulative time counts floors it cleared under the other control scheme
// too. so it lives in a CTE and every caller-supplied condition is applied outside it
const CLEARS_WITH_CUMULATIVE_CTE = `clears_with_cumulative AS (
  SELECT *, SUM(time_spent_on_floor) OVER (
    PARTITION BY party_record_ref ORDER BY floor ROWS UNBOUNDED PRECEDING
  ) AS cumulative_time
  FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS}
)`;

// the inner joins match the assembler's rule that a clear with no resolvable party or game is not on
// the board at all. every read of a board applies them, so they decide the same thing everywhere
const ON_THE_BOARD_JOINS = `JOIN ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} p ON p.id = c.party_record_ref
  JOIN ${RESOURCE_NAMES.LADDER_GAME_RECORDS} g ON g.id = p.game_record_id`;

// one ordering in its two forms: as a sort for the rows of a page, and as a predicate for counting
// the rows that beat one. they have to agree, or a clear's rank would disagree with where it sits on
// the board — and both must match the shared assembler's comparator, tie-break included
const CUMULATIVE_BOARD_ORDER = "c.floor DESC, c.cumulative_time ASC, c.id ASC";
const CUMULATIVE_BOARD_BEATS_TARGET = `c.floor > t.floor
  OR (c.floor = t.floor AND c.cumulative_time < t.cumulative_time)
  OR (c.floor = t.floor AND c.cumulative_time = t.cumulative_time AND c.id < t.id)`;

// the per-floor boards in the same predicate form, one per sort field. a clear is only ever ranked
// against the ascending board, so these have no descending twin the way the page ordering does
const SAME_FLOOR_BOARD_AS_TARGET = "c.floor = t.floor AND c.control_scheme = t.control_scheme";
const FLOOR_BOARD_BEATS_TARGET: Record<FloorClearSortField, string> = {
  [FloorClearSortField.TimeSpentOnFloor]: `c.time_spent_on_floor < t.time_spent_on_floor
    OR (c.time_spent_on_floor = t.time_spent_on_floor AND c.id < t.id)`,
  [FloorClearSortField.CumulativeTimeToClearFloor]: `c.cumulative_time < t.cumulative_time
    OR (c.cumulative_time = t.cumulative_time AND c.id < t.id)`,
};

export class DatabaseLadderRecordsPersistenceStrategy implements LadderRecordsPersistenceStrategy {
  async findParticipantRecordById(
    id: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    const [record] = await ladderParticipantRecordsRepo.findRecordsByIds([id]);
    return record;
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    await ladderParticipantRecordsRepo.insert(record);
  }

  async refreshParticipantUsername(id: IdentityProviderId, username: Username): Promise<void> {
    await ladderParticipantRecordsRepo.updateLastKnownUsername(id, username);
  }

  async updateGameRecord(record: LadderGameRecord): Promise<void> {
    await ladderGameRecordsRepo.update(record);
  }

  async updateGameRecordControlScheme(
    gameId: GameId,
    controlScheme: CharacterControlScheme
  ): Promise<void> {
    await ladderGameRecordsRepo.updateControlScheme(gameId, controlScheme);
  }

  async findPartyRecordById(id: PartyId): Promise<LadderPartyRecord> {
    const record = await ladderPartyRecordsRepo.findRecordById(id);
    invariant(record !== undefined, "expected an existing party record");
    return record;
  }

  async updatePartyRecord(record: LadderPartyRecord): Promise<void> {
    await ladderPartyRecordsRepo.updateFateAndProgress(
      record.id,
      record.fateOption,
      record.deepestFloorReached
    );
  }

  async updatePartyFate(update: LadderPartyFateUpdate): Promise<void> {
    await ladderPartyRecordsRepo.updateFateAndProgress(
      update.partyRecordId,
      update.fate,
      update.deepestFloorReached
    );
  }

  async updateCharacterRecord(record: LadderCharacterRecord): Promise<void> {
    await ladderCharacterRecordsRepo.updateClassLevels(
      record.id,
      record.mainClass.level,
      record.supportClassOption?.level ?? null
    );
  }

  async recordRunAbandonment(
    gameRecordId: GameId,
    participantRecordId: IdentityProviderId,
    timestamp: Milliseconds
  ): Promise<void> {
    await ladderGameParticipationRecordsRepo.updateAbandonedAt(
      gameRecordId,
      participantRecordId,
      timestamp
    );
  }

  async insertNewGameRecordSet(set: NewLadderGameRecordSet): Promise<void> {
    // participant records are global and upserted separately before this call; here we only insert
    // the game and everything that references it, atomically.
    await pgPool.withTransaction(async (transaction) => {
      await ladderGameRecordsRepo.insert(set.game, transaction);
      for (const participant of set.participantRecords) {
        await ladderGameParticipationRecordsRepo.insert(set.game.id, participant.id, transaction);
      }
      for (const party of set.parties) {
        await ladderPartyRecordsRepo.insert(party, transaction);
      }
      for (const character of set.characters) {
        await ladderCharacterRecordsRepo.insert(character, transaction);
      }
    });
  }

  async recordPartyFloorClear(
    partyFloorClear: LadderPartyFloorClearRecord,
    characterFloorClears: LadderCharacterFloorClearRecord[]
  ): Promise<void> {
    await pgPool.withTransaction(async (transaction) => {
      await ladderPartyFloorClearRecordsRepo.insert(partyFloorClear, transaction);
      for (const characterFloorClear of characterFloorClears) {
        await ladderCharacterFloorClearedRecordsRepo.insert(characterFloorClear, transaction);
      }
    });
  }

  async getUserGameRecordsCount(
    userId: IdentityProviderId,
    dateRange?: DateRange
  ): Promise<number> {
    const result = await pgPool.query(
      format(
        `SELECT COUNT(*) FROM ${RESOURCE_NAMES.LADDER_GAME_PARTICIPATION_RECORDS} p
         JOIN ${RESOURCE_NAMES.LADDER_GAME_RECORDS} g ON g.id = p.game_record_id
         WHERE p.participant_record_id = %L %s;`,
        userId,
        dateRangeClause(dateRange)
      )
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getUserGameHistory(
    userId: IdentityProviderId,
    page: number,
    dateRange?: DateRange
  ): Promise<UserGameHistoryEntry[]> {
    const result = await pgPool.query(
      format(
        `SELECT g.id, g.name, g.time_started, p.abandoned_at, fate.fate_type, fate.fate_timestamp
         FROM ${RESOURCE_NAMES.LADDER_GAME_PARTICIPATION_RECORDS} p
         JOIN ${RESOURCE_NAMES.LADDER_GAME_RECORDS} g ON g.id = p.game_record_id
         LEFT JOIN LATERAL (
           SELECT party.fate_type, party.fate_timestamp
           FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} ch
           JOIN ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} party ON party.id = ch.party_record_id
           WHERE ch.controlling_player_id = p.participant_record_id AND party.game_record_id = g.id
           LIMIT 1
         ) fate ON true
         WHERE p.participant_record_id = %L %s
         ORDER BY g.time_started DESC
         LIMIT %L OFFSET %L;`,
        userId,
        dateRangeClause(dateRange),
        USER_GAME_HISTORY_PAGE_SIZE,
        page * USER_GAME_HISTORY_PAGE_SIZE
      )
    );
    return toCamelCase(result.rows).map((row: any) => ({
      gameId: row.id as GameId,
      gameName: row.name as GameName,
      date: timestampToMs(row.timeStarted) ?? 0,
      partyFateOption: row.fateType
        ? { type: row.fateType as PartyFateType, timestamp: timestampToMs(row.fateTimestamp) ?? 0 }
        : undefined,
      abandonedAtOption: timestampToMs(row.abandonedAt),
    }));
  }

  async findGameRecordAggregateById(id: GameId): Promise<LadderGameRecordAggregate | undefined> {
    const game = await ladderGameRecordsRepo.findRecordById(id);
    if (game === undefined) return undefined;

    const participations = await ladderGameParticipationRecordsRepo.findRecordsByGameId(id);
    const participants = await ladderParticipantRecordsRepo.findRecordsByIds(
      participations.map((participation) => participation.participantRecordId)
    );

    const parties = await ladderPartyRecordsRepo.findRecordsByGameIds([id]);
    const partyIds = parties.map((party) => party.id);
    const partyFloorClears = await ladderPartyFloorClearRecordsRepo.findRecordsByPartyIds(partyIds);
    const characters = await ladderCharacterRecordsRepo.findRecordsByPartyIds(partyIds);
    // refs, not records: the aggregate links to snapshots rather than carrying them, so a whole
    // game's serialized combatants never cross the wire to answer this
    const characterSnapshotRefs =
      await ladderCharacterFloorClearedRecordsRepo.findSnapshotRefsByCharacterIds(
        characters.map((character) => character.id)
      );

    return {
      game,
      participants,
      participations,
      parties: parties.map((party) => ({
        party,
        floorClears: partyFloorClears.filter(
          (floorClear) => floorClear.partyRecordRef === party.id
        ),
        characters: characters
          .filter((character) => character.partyRecordId === party.id)
          .map((character) => ({
            character,
            floorClearedSnapshots: characterSnapshotRefs.filter(
              (snapshot) => snapshot.characterRecordRef === character.id
            ),
          })),
      })),
    };
  }

  async getFloorClearTimes(
    query: FloorClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearEntry>> {
    const sort = query.sortOption ?? DEFAULT_FLOOR_CLEAR_SORT;
    const conditions = [format("c.floor = %L", query.floor)];
    if (query.controlSchemeOption !== undefined) {
      conditions.push(
        format("c.control_scheme = %L", CHARACTER_CONTROL_SCHEME_STRINGS[query.controlSchemeOption])
      );
    }
    // mode is a property of the game, so it is the same for every clear a party made — filtering on
    // it cannot change what the window summed
    if (query.modeOption !== undefined) {
      conditions.push(format("g.mode = %L", GAME_MODE_STRINGS[query.modeOption]));
    }
    const whereClause = conditions.join(" AND ");
    const sortColumn =
      sort.field === FloorClearSortField.CumulativeTimeToClearFloor
        ? "c.cumulative_time"
        : "c.time_spent_on_floor";

    const pageClears = await this.loadOrderedFloorClearPage(
      whereClause,
      // the id tie-break stays ascending either way, mirroring the shared assembler's comparator
      `${sortColumn} ${sort.isDescending ? "DESC" : "ASC"}, c.id ASC`,
      query
    );
    const totalEntries = await this.countFloorClears(whereClause);
    const partyIds = unique(pageClears.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    // only this page's parties, and only up to the floor being ranked, for the cumulative sums
    const partyClearHistory = await ladderPartyFloorClearRecordsRepo.findRecordsByPartyIdsUpToFloor(
      partyIds,
      query.floor
    );
    const records = await this.floorClearAssemblyRecords(partyClearHistory);
    return assembleFloorClearPage(pageClears, query, totalEntries, records);
  }

  async getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearEntry>> {
    // the scheme filter sits outside the window on purpose: cumulative time counts every floor the
    // party cleared below this one, including any cleared under the other scheme
    const whereClause = format(
      "c.control_scheme = %L",
      CHARACTER_CONTROL_SCHEME_STRINGS[query.controlScheme]
    );

    const pageClears = await this.loadOrderedFloorClearPage(
      whereClause,
      CUMULATIVE_BOARD_ORDER,
      query
    );
    const totalEntries = await this.countFloorClears(whereClause);
    const partyIds = unique(pageClears.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    // rows here span floors, so each party's whole history is what the sums need
    const partyClearHistory =
      await ladderPartyFloorClearRecordsRepo.findRecordsByPartyIds(partyIds);
    const records = await this.floorClearAssemblyRecords(partyClearHistory);
    return assembleFloorClearPage(pageClears, query, totalEntries, records);
  }

  private async loadOrderedFloorClearPage(
    whereClause: string,
    orderByClause: string,
    query: PagedLadderQuery
  ): Promise<LadderPartyFloorClearRecord[]> {
    const pageSize = pageSizeOf(query);
    const rows = await queryCamel<LadderPartyFloorClearRecordRow>(
      format(
        `WITH ${CLEARS_WITH_CUMULATIVE_CTE}
         SELECT c.* FROM clears_with_cumulative c
         ${ON_THE_BOARD_JOINS}
         WHERE ${whereClause}
         ORDER BY ${orderByClause}
         LIMIT %L OFFSET %L;`,
        pageSize,
        query.page * pageSize
      )
    );
    return rows.map(partyFloorClearRecordFromRow);
  }

  private async countFloorClears(whereClause: string): Promise<number> {
    const result = await pgPool.query(
      `SELECT COUNT(*) FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} c
       ${ON_THE_BOARD_JOINS}
       WHERE ${whereClause};`
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findFloorClearById(
    id: LadderPartyFloorClearRecordId
  ): Promise<FloorClearEntry | undefined> {
    const partyFloorClear = await ladderPartyFloorClearRecordsRepo.findRecordById(id);
    if (partyFloorClear === undefined) {
      return undefined;
    }
    // the same history a board row would sum, so the standalone page reports the same numbers
    const partyClearHistory = await ladderPartyFloorClearRecordsRepo.findRecordsByPartyIdsUpToFloor(
      [partyFloorClear.partyRecordRef],
      partyFloorClear.floor
    );
    const records = await this.floorClearAssemblyRecords(partyClearHistory);
    return assembleFloorClearById(id, records);
  }

  // a rank is a count of the clears that beat this one, not a board built and searched for it. the
  // scheme comes off the target row, since a clear names the board it is on
  async getCumulativeClearRanks(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<Record<LadderPartyFloorClearRecordId, number>> {
    // load-bearing, not an optimization: an empty list formats to `IN ()`, which does not parse
    if (ids.length === 0) {
      return {};
    }

    const rows = await queryCamel<{ id: LadderPartyFloorClearRecordId; rank: string }>(
      format(
        `WITH ${CLEARS_WITH_CUMULATIVE_CTE},
         on_the_board AS (
           SELECT c.* FROM clears_with_cumulative c ${ON_THE_BOARD_JOINS}
         )
         SELECT t.id, (
           SELECT COUNT(*) + 1 FROM on_the_board c
           WHERE c.control_scheme = t.control_scheme AND (${CUMULATIVE_BOARD_BEATS_TARGET})
         ) AS rank
         FROM on_the_board t WHERE t.id IN (%L);`,
        ids
      )
    );

    const ranksById: Record<LadderPartyFloorClearRecordId, number> = {};
    for (const row of rows) {
      ranksById[row.id] = parseInt(row.rank, 10);
    }
    return ranksById;
  }

  // both boards for the clear's floor in one pass: the counts differ only in which column they
  // compare, and the CTE they read is the expensive part to build twice
  async getFloorClearTimeRanks(
    id: LadderPartyFloorClearRecordId
  ): Promise<FloorClearTimeRanks | undefined> {
    const [row] = await queryCamel<{ timeSpentRank: string; cumulativeRank: string }>(
      format(
        `WITH ${CLEARS_WITH_CUMULATIVE_CTE},
         on_the_board AS (
           SELECT c.* FROM clears_with_cumulative c ${ON_THE_BOARD_JOINS}
         )
         SELECT (
           SELECT COUNT(*) + 1 FROM on_the_board c
           WHERE ${SAME_FLOOR_BOARD_AS_TARGET}
             AND (${FLOOR_BOARD_BEATS_TARGET[FloorClearSortField.TimeSpentOnFloor]})
         ) AS time_spent_rank, (
           SELECT COUNT(*) + 1 FROM on_the_board c
           WHERE ${SAME_FLOOR_BOARD_AS_TARGET}
             AND (${FLOOR_BOARD_BEATS_TARGET[FloorClearSortField.CumulativeTimeToClearFloor]})
         ) AS cumulative_rank
         FROM on_the_board t WHERE t.id = %L;`,
        id
      )
    );

    if (row === undefined) {
      return undefined;
    }

    return {
      [FloorClearSortField.TimeSpentOnFloor]: parseInt(row.timeSpentRank, 10),
      [FloorClearSortField.CumulativeTimeToClearFloor]: parseInt(row.cumulativeRank, 10),
    };
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateEntry>> {
    const games = await ladderGameRecordsRepo.findRecordsByMode(GameMode.RankedRace);
    const parties = await ladderPartyRecordsRepo.findRecordsByGameIds(games.map((game) => game.id));
    const characters = await ladderCharacterRecordsRepo.findRecordsByPartyIds(
      parties.map((party) => party.id)
    );
    const participantIds = await ladderParticipantRecordsRepo.findAllIds();
    return assembleWinRateLadderPage(query, { participantIds, games, parties, characters });
  }

  async getPlayerProfileData(userId: IdentityProviderId): Promise<PlayerProfileData | undefined> {
    const participant = await this.findParticipantRecordById(userId);
    if (participant === undefined) {
      return undefined;
    }

    const userCharacters =
      await ladderCharacterRecordsRepo.findRecordsByControllingPlayerId(userId);
    const userPartyIds = unique(userCharacters.map((character) => character.partyRecordId));
    const userParties = await ladderPartyRecordsRepo.findRecordsByIds(userPartyIds);
    const gameIds = unique(userParties.map((party) => party.gameRecordId));
    const games = await ladderGameRecordsRepo.findRecordsByIds(gameIds);

    // tally over ranked races: needs every party in those games (winner = earliest escape), but
    // those are tiny fate rows — no snapshot blobs, no character loads beyond the user's own.
    const partiesInGames = await ladderPartyRecordsRepo.findRecordsByGameIds(gameIds);
    const rankedRaceTally = computeRankedRaceTally(userId, games, partiesInGames, userCharacters);

    // personal bests: pick the user's best clears FIRST, then load characters only for that
    // handful — never for rival parties or non-best clears.
    const userPartyFloorClears =
      await ladderPartyFloorClearRecordsRepo.findRecordsByPartyIds(userPartyIds);
    // the user's full clear history covers floors <= each best, for cumulativeTimeToClearFloor —
    // which the cumulative selection needs before it can pick anything, not only afterwards
    const selectionRecords: PersonalBestSelectionRecords = {
      parties: userParties,
      games,
      partyFloorClears: userPartyFloorClears,
    };
    const bestFloorTimes = selectPersonalBestPartyFloorClears(
      userPartyFloorClears,
      selectionRecords,
      FloorClearSortField.TimeSpentOnFloor
    );
    const bestCumulativeTimes = selectPersonalBestPartyFloorClears(
      userPartyFloorClears,
      selectionRecords,
      FloorClearSortField.CumulativeTimeToClearFloor
    );

    // one load for both lists: the two overlap heavily, and loading per list would fetch the same
    // parties' characters and the same snapshot refs twice
    const bests = [...bestFloorTimes, ...bestCumulativeTimes];
    const bestPartyIds = unique(bests.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    const bestPartyCharacters =
      await ladderCharacterRecordsRepo.findRecordsByPartyIds(bestPartyIds);
    const bestSnapshots =
      await ladderCharacterFloorClearedRecordsRepo.findSnapshotRefsByPartyFloorClearIds(
        unique(bests.map((partyFloorClear) => partyFloorClear.id))
      );
    // the selection records plus what only assembly needs, so the two phases cannot disagree about
    // which parties, games or clear history a row was built from
    const assemblyRecords: FloorClearAssemblyRecords = {
      ...selectionRecords,
      characters: bestPartyCharacters,
      snapshots: bestSnapshots,
    };

    return {
      participantId: userId,
      rankedRaceTally,
      personalBestFloorTimes: assemblePersonalBestEntries(bestFloorTimes, assemblyRecords),
      personalBestCumulativeTimes: assemblePersonalBestEntries(
        bestCumulativeTimes,
        assemblyRecords
      ),
    };
  }

  async getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined> {
    const snapshot = await ladderCharacterFloorClearedRecordsRepo.findRecordById(id);
    if (snapshot === undefined) {
      return undefined;
    }
    const character = await ladderCharacterRecordsRepo.findRecordById(snapshot.characterRecordRef);
    return assembleCharacterFloorClearSnapshot(snapshot, character?.name ?? "");
  }

  private async floorClearAssemblyRecords(
    partyFloorClears: LadderPartyFloorClearRecord[]
  ): Promise<FloorClearAssemblyRecords> {
    const partyIds = unique(
      partyFloorClears.map((partyFloorClear) => partyFloorClear.partyRecordRef)
    );
    const parties = await ladderPartyRecordsRepo.findRecordsByIds(partyIds);
    const games = await ladderGameRecordsRepo.findRecordsByIds(
      unique(parties.map((party) => party.gameRecordId))
    );
    const characters = await ladderCharacterRecordsRepo.findRecordsByPartyIds(partyIds);
    const snapshots =
      await ladderCharacterFloorClearedRecordsRepo.findSnapshotRefsByPartyFloorClearIds(
        partyFloorClears.map((partyFloorClear) => partyFloorClear.id)
      );
    return { partyFloorClears, parties, games, characters, snapshots };
  }
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function queryCamel<T>(sql: string): Promise<T[]> {
  const result = await pgPool.query(sql);
  return toCamelCase(result.rows) as unknown as T[];
}

function dateRangeClause(dateRange?: DateRange): string {
  if (dateRange === undefined) return "";
  return format(
    "AND g.time_started BETWEEN to_timestamp(%L::double precision / 1000.0) AND to_timestamp(%L::double precision / 1000.0)",
    dateRange.start,
    dateRange.end
  );
}

import format from "pg-format";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  COMBATANT_CLASS_NAME_STRINGS,
  CharacterControlScheme,
  CombatantClass,
  CombatantId,
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
  LadderGameParticipationRecord,
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
  PartyName,
  USER_GAME_HISTORY_PAGE_SIZE,
  UserGameHistoryEntry,
  Username,
  CharacterFloorClearSnapshotView,
  FloorClearEntry,
  FloorClearProjectionRecords,
  RankedFloorClearEntry,
  projectFloorClearById,
  FloorClearSnapshotRef,
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  LadderPage,
  LadderPartyFloorClearRecordId,
  PlayerProfileData,
  WinRateEntry,
  WinRateLadderQuery,
  assemblePersonalBestEntries,
  computeRankedRaceTally,
  projectCharacterFloorClearSnapshot,
  assembleFloorClearPage,
  DEFAULT_FLOOR_CLEAR_SORT,
  FloorClearSortField,
  PagedLadderQuery,
  pageSizeOf,
  projectWinRateLadderPage,
  selectPersonalBestPartyFloorClears,
} from "@speed-dungeon/common";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../../database/db-consts.js";
import { toCamelCase } from "../../database/utils.js";
import {
  ladderGameRecordsRepo,
  LadderGameRecordRow,
} from "../../database/repos/ladder-game-records.js";
import { ladderParticipantRecordsRepo } from "../../database/repos/ladder-participant-records.js";
import { ladderGameParticipationRecordsRepo } from "../../database/repos/ladder-game-participation-records.js";
import {
  ladderPartyRecordsRepo,
  LadderPartyRecordRow,
} from "../../database/repos/ladder-party-records.js";
import {
  LadderCharacterRecordRow,
  ladderCharacterRecordsRepo,
} from "../../database/repos/ladder-character-records.js";
import {
  ladderPartyFloorClearRecordsRepo,
  LadderPartyFloorClearRecordRow,
} from "../../database/repos/ladder-party-floor-clear-records.js";
import {
  ladderCharacterFloorClearedRecordsRepo,
  LadderCharacterFloorClearedRecordRow,
} from "../../database/repos/ladder-character-floor-cleared-records.js";

// DB stores enums as their forward-mapped display string; the *_STRINGS maps only go enum -> string,
// so we invert them once here for reading rows back into domain records.
const GAME_MODE_FROM_STRING = invertNumericEnumStringMap(GAME_MODE_STRINGS);
const CONTROL_SCHEME_FROM_STRING = invertNumericEnumStringMap(CHARACTER_CONTROL_SCHEME_STRINGS);
// character rows store the lowercased class name (see classToColumn in the character repo)
const COMBATANT_CLASS_FROM_COLUMN = new Map<string, CombatantClass>();
for (const [key, value] of Object.entries(COMBATANT_CLASS_NAME_STRINGS)) {
  COMBATANT_CLASS_FROM_COLUMN.set(value.toLowerCase(), Number(key) as CombatantClass);
}

export class DatabaseLadderRecordsPersistenceStrategy implements LadderRecordsPersistenceStrategy {
  async findParticipantRecordById(
    id: IdentityProviderId
  ): Promise<LadderParticipantRecord | undefined> {
    const row = await ladderParticipantRecordsRepo.findById(id.toString());
    if (row === undefined) return undefined;
    return {
      id: row.id,
      lastKnownUsername: (row.lastKnownUsername as Username) ?? undefined,
    };
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
    const row = await ladderPartyRecordsRepo.findById(id);
    invariant(row !== undefined, "expected an existing party record");
    return partyRowToRecord(row);
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
    const gameRow = await ladderGameRecordsRepo.findById(id);
    if (gameRow === undefined) return undefined;

    const participationRows = await queryCamel<{
      gameRecordId: string;
      participantRecordId: number;
      abandonedAt: Date | string | null;
    }>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_GAME_PARTICIPATION_RECORDS} WHERE game_record_id = %L;`,
        id
      )
    );
    const participations: LadderGameParticipationRecord[] = participationRows.map((row) => ({
      gameRecordId: row.gameRecordId as GameId,
      participantRecordId: row.participantRecordId as IdentityProviderId,
      abandonedAtOption: timestampToMs(row.abandonedAt),
    }));

    const participantIds = participations.map((participation) => participation.participantRecordId);
    const participants: LadderParticipantRecord[] = participantIds.length
      ? (
          await queryCamel<{ id: number; lastKnownUsername: string | null }>(
            format(
              `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS} WHERE id IN (%L);`,
              participantIds
            )
          )
        ).map((row) => ({
          id: row.id as IdentityProviderId,
          lastKnownUsername: (row.lastKnownUsername as Username) ?? undefined,
        }))
      : [];

    const partyRows = await queryCamel<LadderPartyRecordRow>(
      format(`SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} WHERE game_record_id = %L;`, id)
    );
    const partyIds = partyRows.map((row) => row.id);

    const partyFloorClearRows = partyIds.length
      ? await queryCamel<LadderPartyFloorClearRecordRow>(
          format(
            `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} WHERE party_record_ref IN (%L);`,
            partyIds
          )
        )
      : [];
    const characterRows = partyIds.length
      ? await queryCamel<LadderCharacterRecordRow>(
          format(
            `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} WHERE party_record_id IN (%L);`,
            partyIds
          )
        )
      : [];
    // refs, not records: the aggregate links to snapshots rather than carrying them, so a whole
    // game's serialized combatants never cross the wire to answer this
    const characterSnapshotRefs = await this.loadSnapshotRefsByCharacterIds(
      characterRows.map((row) => row.id as CombatantId)
    );

    const parties = partyRows.map((partyRow) => ({
      party: partyRowToRecord(partyRow),
      floorClears: partyFloorClearRows
        .filter((floorClear) => floorClear.partyRecordRef === partyRow.id)
        .map(partyFloorClearRowToRecord),
      characters: characterRows
        .filter((character) => character.partyRecordId === partyRow.id)
        .map((characterRow) => ({
          character: characterRowToRecord(characterRow),
          floorClearedSnapshots: characterSnapshotRefs.filter(
            (snapshot) => snapshot.characterRecordRef === characterRow.id
          ),
        })),
    }));

    return { game: gameRowToRecord(gameRow), participants, participations, parties };
  }

  // read side. loads the ladder-records rows each projection needs and hands them to the shared
  // both boards filter, order and slice in SQL, then hydrate only the page's rows. the in-memory
  // strategy stays on the sorting projections and remains the oracle the ladder suite compares to.
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
      // the id tie-break stays ascending either way, mirroring the shared projection's comparator
      `${sortColumn} ${sort.isDescending ? "DESC" : "ASC"}, c.id ASC`,
      query
    );
    const totalEntries = await this.countFloorClears(whereClause);
    const partyIds = unique(pageClears.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    // only this page's parties, and only up to the floor being ranked, for the cumulative sums
    const partyClearHistory = await this.loadPartyFloorClearsUpToFloor(partyIds, query.floor);
    const records = await this.floorClearProjectionRecords(partyClearHistory);
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
      "c.floor DESC, c.cumulative_time ASC, c.id ASC",
      query
    );
    const totalEntries = await this.countFloorClears(whereClause);
    const partyIds = unique(pageClears.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    // rows here span floors, so each party's whole history is what the sums need
    const partyClearHistory = await this.loadPartyFloorClearsByPartyIds(partyIds);
    const records = await this.floorClearProjectionRecords(partyClearHistory);
    return assembleFloorClearPage(pageClears, query, totalEntries, records);
  }

  // the running total has to be computed before any row filter is applied, so it lives in a CTE and
  // every caller-supplied condition is applied outside it
  private async loadOrderedFloorClearPage(
    whereClause: string,
    orderByClause: string,
    query: PagedLadderQuery
  ): Promise<LadderPartyFloorClearRecord[]> {
    const pageSize = pageSizeOf(query);
    const rows = await queryCamel<LadderPartyFloorClearRecordRow>(
      format(
        `WITH clears_with_cumulative AS (
           SELECT *, SUM(time_spent_on_floor) OVER (
             PARTITION BY party_record_ref ORDER BY floor ROWS UNBOUNDED PRECEDING
           ) AS cumulative_time
           FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS}
         )
         SELECT c.* FROM clears_with_cumulative c
         JOIN ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} p ON p.id = c.party_record_ref
         JOIN ${RESOURCE_NAMES.LADDER_GAME_RECORDS} g ON g.id = p.game_record_id
         WHERE ${whereClause}
         ORDER BY ${orderByClause}
         LIMIT %L OFFSET %L;`,
        pageSize,
        query.page * pageSize
      )
    );
    return rows.map(partyFloorClearRowToRecord);
  }

  // the inner joins match the projection's rule that a clear with no resolvable party or game is
  // not on the board at all
  private async countFloorClears(whereClause: string): Promise<number> {
    const result = await pgPool.query(
      `SELECT COUNT(*) FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} c
       JOIN ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} p ON p.id = c.party_record_ref
       JOIN ${RESOURCE_NAMES.LADDER_GAME_RECORDS} g ON g.id = p.game_record_id
       WHERE ${whereClause};`
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findFloorClearById(
    id: LadderPartyFloorClearRecordId
  ): Promise<FloorClearEntry | undefined> {
    const rows = await queryCamel<LadderPartyFloorClearRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} WHERE id = %L;`,
        id
      )
    );
    const row = rows[0];
    if (row === undefined) {
      return undefined;
    }
    const partyFloorClear = partyFloorClearRowToRecord(row);
    // the same history a board row would sum, so the standalone page reports the same numbers
    const partyClearHistory = await this.loadPartyFloorClearsUpToFloor(
      [partyFloorClear.partyRecordRef],
      partyFloorClear.floor
    );
    const records = await this.floorClearProjectionRecords(partyClearHistory);
    return projectFloorClearById(id, records);
  }

  async getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateEntry>> {
    const gameRows = await queryCamel<LadderGameRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_GAME_RECORDS} WHERE mode = %L;`,
        GAME_MODE_STRINGS[GameMode.RankedRace]
      )
    );
    const games = gameRows.map(gameRowToRecord);
    const parties = await this.loadPartiesByGameIds(games.map((game) => game.id));
    const characters = await this.loadCharactersByPartyIds(parties.map((party) => party.id));
    const participantRows = await queryCamel<{ id: number }>(
      format(`SELECT id FROM ${RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS};`)
    );
    const participantIds = participantRows.map((row) => row.id as IdentityProviderId);
    return projectWinRateLadderPage(query, { participantIds, games, parties, characters });
  }

  async getPlayerProfileData(userId: IdentityProviderId): Promise<PlayerProfileData | undefined> {
    const participant = await this.findParticipantRecordById(userId);
    if (participant === undefined) {
      return undefined;
    }

    const userCharacters = await this.loadCharactersByOwner(userId);
    const userPartyIds = unique(userCharacters.map((character) => character.partyRecordId));
    const userParties = await this.loadPartiesByIds(userPartyIds);
    const gameIds = unique(userParties.map((party) => party.gameRecordId));
    const games = await this.loadGamesByIds(gameIds);

    // tally over ranked races: needs every party in those games (winner = earliest escape), but
    // those are tiny fate rows — no snapshot blobs, no character loads beyond the user's own.
    const partiesInGames = await this.loadPartiesByGameIds(gameIds);
    const rankedRaceTally = computeRankedRaceTally(userId, games, partiesInGames, userCharacters);

    // personal bests: pick the user's fastest clears FIRST, then load characters only for that
    // handful — never for rival parties or non-best clears.
    const userPartyFloorClears = await this.loadPartyFloorClearsByPartyIds(userPartyIds);
    const bests = selectPersonalBestPartyFloorClears(userPartyFloorClears, userParties, games);
    const bestPartyIds = unique(bests.map((partyFloorClear) => partyFloorClear.partyRecordRef));
    const bestPartyCharacters = await this.loadCharactersByPartyIds(bestPartyIds);
    const bestSnapshots = await this.loadSnapshotRefsByPartyFloorClearIds(
      bests.map((partyFloorClear) => partyFloorClear.id)
    );
    const personalBestFloorClears = assemblePersonalBestEntries(bests, {
      parties: userParties,
      games,
      characters: bestPartyCharacters,
      snapshots: bestSnapshots,
      // the user's full clear history covers floors <= each best, for cumulativeTimeToClearFloor
      partyClearHistory: userPartyFloorClears,
    });

    return { participantId: userId, rankedRaceTally, personalBestFloorClears };
  }

  async getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined> {
    const snapshotRows = await queryCamel<LadderCharacterFloorClearedRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS} WHERE id = %L;`,
        id
      )
    );
    const snapshotRow = snapshotRows[0];
    if (snapshotRow === undefined) {
      return undefined;
    }
    const snapshot = characterFloorClearedRowToRecord(snapshotRow);
    const characterRows = await queryCamel<LadderCharacterRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} WHERE id = %L;`,
        snapshot.characterRecordRef
      )
    );
    return projectCharacterFloorClearSnapshot(snapshot, characterRows[0]?.name ?? "");
  }

  private async floorClearProjectionRecords(
    partyFloorClears: LadderPartyFloorClearRecord[]
  ): Promise<FloorClearProjectionRecords> {
    const partyIds = unique(
      partyFloorClears.map((partyFloorClear) => partyFloorClear.partyRecordRef)
    );
    const parties = await this.loadPartiesByIds(partyIds);
    const games = await this.loadGamesByIds(unique(parties.map((party) => party.gameRecordId)));
    const characters = await this.loadCharactersByPartyIds(partyIds);
    const snapshots = await this.loadSnapshotRefsByPartyFloorClearIds(
      partyFloorClears.map((partyFloorClear) => partyFloorClear.id)
    );
    return { partyFloorClears, parties, games, characters, snapshots };
  }

  private async loadGamesByIds(ids: GameId[]): Promise<LadderGameRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderGameRecordRow>(
      format(`SELECT * FROM ${RESOURCE_NAMES.LADDER_GAME_RECORDS} WHERE id IN (%L);`, ids)
    );
    return rows.map(gameRowToRecord);
  }

  private async loadPartiesByIds(ids: PartyId[]): Promise<LadderPartyRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderPartyRecordRow>(
      format(`SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} WHERE id IN (%L);`, ids)
    );
    return rows.map(partyRowToRecord);
  }

  private async loadPartiesByGameIds(gameIds: GameId[]): Promise<LadderPartyRecord[]> {
    if (gameIds.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderPartyRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_RECORDS} WHERE game_record_id IN (%L);`,
        gameIds
      )
    );
    return rows.map(partyRowToRecord);
  }

  private async loadCharactersByIds(ids: CombatantId[]): Promise<LadderCharacterRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderCharacterRecordRow>(
      format(`SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} WHERE id IN (%L);`, ids)
    );
    return rows.map(characterRowToRecord);
  }

  private async loadCharactersByPartyIds(partyIds: PartyId[]): Promise<LadderCharacterRecord[]> {
    if (partyIds.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderCharacterRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} WHERE party_record_id IN (%L);`,
        partyIds
      )
    );
    return rows.map(characterRowToRecord);
  }

  private async loadCharactersByOwner(
    userId: IdentityProviderId
  ): Promise<LadderCharacterRecord[]> {
    const rows = await queryCamel<LadderCharacterRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_RECORDS} WHERE controlling_player_id = %L;`,
        userId
      )
    );
    return rows.map(characterRowToRecord);
  }

  private async loadPartyFloorClearsByPartyIds(
    partyIds: PartyId[]
  ): Promise<LadderPartyFloorClearRecord[]> {
    if (partyIds.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderPartyFloorClearRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} WHERE party_record_ref IN (%L);`,
        partyIds
      )
    );
    return rows.map(partyFloorClearRowToRecord);
  }

  private async loadPartyFloorClearsUpToFloor(
    partyIds: PartyId[],
    floor: number
  ): Promise<LadderPartyFloorClearRecord[]> {
    if (partyIds.length === 0) {
      return [];
    }
    const rows = await queryCamel<LadderPartyFloorClearRecordRow>(
      format(
        `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS} WHERE party_record_ref IN (%L) AND floor <= %L;`,
        partyIds,
        floor
      )
    );
    return rows.map(partyFloorClearRowToRecord);
  }

  private async loadSnapshotRefsByPartyFloorClearIds(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<FloorClearSnapshotRef[]> {
    return this.loadSnapshotRefsWhere("party_floor_clear_record", ids);
  }

  private async loadSnapshotRefsByCharacterIds(
    ids: CombatantId[]
  ): Promise<FloorClearSnapshotRef[]> {
    return this.loadSnapshotRefsWhere("character_record_ref", ids);
  }

  // deliberately not SELECT *: this table's combatant_with_pets column is the largest data in the
  // schema, and everything that links to a snapshot needs nothing from it but the id
  private async loadSnapshotRefsWhere(
    column: "party_floor_clear_record" | "character_record_ref",
    ids: string[]
  ): Promise<FloorClearSnapshotRef[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await queryCamel<{
      id: string;
      partyFloorClearRecord: string;
      characterRecordRef: string;
    }>(
      format(
        `SELECT id, party_floor_clear_record, character_record_ref
         FROM ${RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS}
         WHERE ${column} IN (%L);`,
        ids
      )
    );
    return rows.map((row) => ({
      id: row.id as LadderCharacterFloorClearRecordId,
      partyFloorClearRecord: row.partyFloorClearRecord as LadderPartyFloorClearRecordId,
      characterRecordRef: row.characterRecordRef as CombatantId,
    }));
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

function timestampToMs(value: Date | string | null): Milliseconds | undefined {
  if (value === null) return undefined;
  return new Date(value).getTime() as Milliseconds;
}

function invertNumericEnumStringMap<T extends number>(map: Record<T, string>): Map<string, T> {
  const inverted = new Map<string, T>();
  for (const [key, value] of Object.entries(map)) {
    inverted.set(value as string, Number(key) as T);
  }
  return inverted;
}

function gameModeFromString(value: string): GameMode {
  const mode = GAME_MODE_FROM_STRING.get(value);
  invariant(mode !== undefined, `unknown game mode string from db: ${value}`);
  return mode;
}

function controlSchemeFromString(value: string): CharacterControlScheme {
  const scheme = CONTROL_SCHEME_FROM_STRING.get(value);
  invariant(scheme !== undefined, `unknown control scheme string from db: ${value}`);
  return scheme;
}

function combatantClassFromColumn(value: string): CombatantClass {
  const combatantClass = COMBATANT_CLASS_FROM_COLUMN.get(value);
  invariant(combatantClass !== undefined, `unknown combatant class column from db: ${value}`);
  return combatantClass;
}

function gameRowToRecord(row: LadderGameRecordRow): LadderGameRecord {
  invariant(row.timeStarted !== null, "expected a game record to have a start time");
  return {
    id: row.id as GameId,
    createdAt: new Date(row.createdAt).getTime() as Milliseconds,
    updatedAt: new Date(row.updatedAt).getTime() as Milliseconds,
    name: row.name as GameName,
    mode: gameModeFromString(row.mode),
    controlScheme: controlSchemeFromString(row.controlScheme),
    timeStarted: new Date(row.timeStarted).getTime() as Milliseconds,
  };
}

function partyRowToRecord(row: LadderPartyRecordRow): LadderPartyRecord {
  return {
    id: row.id as PartyId,
    gameRecordId: row.gameRecordId as GameId,
    name: row.name as PartyName,
    fateOption:
      row.fateType === null
        ? undefined
        : {
            type: row.fateType as PartyFateType,
            timestamp: timestampToMs(row.fateTimestamp) ?? 0,
          },
    deepestFloorReached: row.deepestFloorReached,
  };
}

function characterRowToRecord(row: LadderCharacterRecordRow): LadderCharacterRecord {
  return {
    id: row.id as CombatantId,
    name: row.name,
    mainClass: {
      combatantClass: combatantClassFromColumn(row.mainClass),
      level: row.mainClassLevel,
    },
    supportClassOption:
      row.supportClassOption === null
        ? undefined
        : {
            combatantClass: combatantClassFromColumn(row.supportClassOption),
            level: row.supportClassOptionLevel ?? 0,
          },
    controllingPlayerId: row.controllingPlayerId as unknown as IdentityProviderId,
    partyRecordId: row.partyRecordId as PartyId,
  };
}

function partyFloorClearRowToRecord(
  row: LadderPartyFloorClearRecordRow
): LadderPartyFloorClearRecord {
  return {
    id: row.id as LadderPartyFloorClearRecordId,
    partyRecordRef: row.partyRecordRef as PartyId,
    floor: row.floor,
    timeSpentOnFloor: Number(row.timeSpentOnFloor) as Milliseconds,
    controlScheme: controlSchemeFromString(row.controlScheme),
    clearedAt: requireTimestampMs(row.clearedAt),
  };
}

// the column is NOT NULL, so a missing value means the row was written by something that bypassed
// the write path rather than a legitimately absent date
function requireTimestampMs(value: Date | string): Milliseconds {
  const timestampOption = timestampToMs(value);
  invariant(timestampOption !== undefined, "floor clear record is missing cleared_at");
  return timestampOption;
}

function characterFloorClearedRowToRecord(
  row: LadderCharacterFloorClearedRecordRow
): LadderCharacterFloorClearRecord {
  return {
    id: row.id as LadderCharacterFloorClearRecordId,
    combatantSchemaVersion: row.combatantSchemaVersion,
    partyFloorClearRecord: row.partyFloorClearRecord as LadderPartyFloorClearRecordId,
    characterRecordRef: row.characterRecordRef as CombatantId,
    combatantWithPets: row.combatantWithPets,
  };
}

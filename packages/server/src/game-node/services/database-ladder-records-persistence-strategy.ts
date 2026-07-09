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
  LadderPartyFloorClearRecordId,
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
      usernameAtTimeOfAccountDeletion:
        (row.usernameAtTimeOfAccountDeletion as Username) ?? undefined,
    };
  }

  async upsertParticipantRecord(record: LadderParticipantRecord): Promise<void> {
    await ladderParticipantRecordsRepo.insert(record);
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
      fateOptionOfQueryingPlayerParty: row.fateType
        ? { type: row.fateType as PartyFateType, timestamp: timestampToMs(row.fateTimestamp) ?? 0 }
        : undefined,
      queryingPlayerAbandonedAtOption: timestampToMs(row.abandonedAt),
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
          await queryCamel<{ id: number; usernameAtTimeOfAccountDeletion: string | null }>(
            format(
              `SELECT * FROM ${RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS} WHERE id IN (%L);`,
              participantIds
            )
          )
        ).map((row) => ({
          id: row.id as IdentityProviderId,
          usernameAtTimeOfAccountDeletion:
            (row.usernameAtTimeOfAccountDeletion as Username) ?? undefined,
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
    const characterIds = characterRows.map((row) => row.id);
    const characterFloorClearRows = characterIds.length
      ? await queryCamel<LadderCharacterFloorClearedRecordRow>(
          format(
            `SELECT * FROM ${RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS} WHERE character_record_ref IN (%L);`,
            characterIds
          )
        )
      : [];

    const parties = partyRows.map((partyRow) => ({
      party: partyRowToRecord(partyRow),
      floorClears: partyFloorClearRows
        .filter((floorClear) => floorClear.partyRecordRef === partyRow.id)
        .map(partyFloorClearRowToRecord),
      characters: characterRows
        .filter((character) => character.partyRecordId === partyRow.id)
        .map((characterRow) => ({
          character: characterRowToRecord(characterRow),
          floorClearedSnapshots: characterFloorClearRows
            .filter((snapshot) => snapshot.characterRecordRef === characterRow.id)
            .map(characterFloorClearedRowToRecord),
        })),
    }));

    return { game: gameRowToRecord(gameRow), participants, participations, parties };
  }
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
  };
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

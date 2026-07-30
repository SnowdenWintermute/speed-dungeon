import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  CharacterControlScheme,
  CHARACTER_CONTROL_SCHEME_STRINGS,
  GameId,
  GameMode,
  GameName,
  GAME_MODE_STRINGS,
  invariant,
  LadderGameRecord,
  Milliseconds,
} from "@speed-dungeon/common";
import { controlSchemeFromString, gameModeFromString } from "../row-conversions.js";

const tableName = RESOURCE_NAMES.LADDER_GAME_RECORDS;

export interface LadderGameRecordRow {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  name: string;
  mode: string;
  controlScheme: string;
  timeStarted: Date | string | null;
}

type LadderGameRecordInsert = Omit<
  LadderGameRecord,
  "createdAt" | "updatedAt" | "partyRecordRefs" | "participantRecords"
>;

class LadderGameRecordsRepo extends DatabaseRepository<LadderGameRecordRow> {
  async findRecordById(id: GameId): Promise<LadderGameRecord | undefined> {
    const row = await this.findById(id);
    if (row === undefined) {
      return undefined;
    }
    return rowToRecord(row);
  }

  async findRecordsByIds(ids: GameId[]): Promise<LadderGameRecord[]> {
    return (await this.findWhereIn("id", ids)).map(rowToRecord);
  }

  async findRecordsByMode(mode: GameMode): Promise<LadderGameRecord[]> {
    const rows = await this.find("mode", GAME_MODE_STRINGS[mode]);
    return (rows ?? []).map(rowToRecord);
  }

  async insert(record: LadderGameRecordInsert, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName} (id, name, mode, control_scheme, time_started)
         VALUES (%L, %L, %L, %L, to_timestamp(%L::double precision / 1000.0));`,
        record.id,
        record.name,
        GAME_MODE_STRINGS[record.mode],
        CHARACTER_CONTROL_SCHEME_STRINGS[record.controlScheme],
        record.timeStarted
      )
    );
  }

  async update(record: LadderGameRecordInsert, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `UPDATE ${tableName}
         SET name = %L, mode = %L, control_scheme = %L,
             time_started = to_timestamp(%L::double precision / 1000.0), updated_at = CURRENT_TIMESTAMP
         WHERE id = %L;`,
        record.name,
        GAME_MODE_STRINGS[record.mode],
        CHARACTER_CONTROL_SCHEME_STRINGS[record.controlScheme],
        record.timeStarted,
        record.id
      )
    );
  }

  async updateControlScheme(
    id: GameId,
    controlScheme: CharacterControlScheme,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `UPDATE ${tableName} SET control_scheme = %L, updated_at = CURRENT_TIMESTAMP WHERE id = %L;`,
        CHARACTER_CONTROL_SCHEME_STRINGS[controlScheme],
        id
      )
    );
  }
}

function rowToRecord(row: LadderGameRecordRow): LadderGameRecord {
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

export const ladderGameRecordsRepo = new LadderGameRecordsRepo(pgPool, tableName);

import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  CharacterControlScheme,
  CHARACTER_CONTROL_SCHEME_STRINGS,
  GameId,
  GAME_MODE_STRINGS,
  LadderGameRecord,
} from "@speed-dungeon/common";

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

export const ladderGameRecordsRepo = new LadderGameRecordsRepo(pgPool, tableName);

import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
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
}

export const ladderGameRecordsRepo = new LadderGameRecordsRepo(pgPool, tableName);

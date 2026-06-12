import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import { LadderPartyFloorClearRecord } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS;

export interface LadderPartyFloorClearRecordRow {
  id: string;
  partyRecordRef: string;
  floor: number;
  timeSpentOnFloor: number;
}

class LadderPartyFloorClearRecordsRepo extends DatabaseRepository<LadderPartyFloorClearRecordRow> {
  async insert(record: LadderPartyFloorClearRecord, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName} (id, party_record_ref, floor, time_spent_on_floor)
         VALUES (%L, %L, %L, %L);`,
        record.id,
        record.partyRecordRef,
        record.floor,
        record.timeSpentOnFloor
      )
    );
  }
}

export const ladderPartyFloorClearRecordsRepo = new LadderPartyFloorClearRecordsRepo(
  pgPool,
  tableName
);

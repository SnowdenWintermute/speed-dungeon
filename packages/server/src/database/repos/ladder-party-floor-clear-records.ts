import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  LadderPartyFloorClearRecord,
  LadderPartyFloorClearRecordId,
  Milliseconds,
  PartyId,
  invariant,
} from "@speed-dungeon/common";
import { controlSchemeFromString, timestampToMs } from "../row-conversions.js";
import { toCamelCase } from "../utils.js";

const tableName = RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS;

export interface LadderPartyFloorClearRecordRow {
  id: string;
  partyRecordRef: string;
  floor: number;
  timeSpentOnFloor: number;
  controlScheme: string;
  clearedAt: Date | string;
}

class LadderPartyFloorClearRecordsRepo extends DatabaseRepository<LadderPartyFloorClearRecordRow> {
  async findRecordById(
    id: LadderPartyFloorClearRecordId
  ): Promise<LadderPartyFloorClearRecord | undefined> {
    const row = await this.findById(id);
    if (row === undefined) {
      return undefined;
    }
    return partyFloorClearRecordFromRow(row);
  }

  async findRecordsByPartyIds(partyIds: PartyId[]): Promise<LadderPartyFloorClearRecord[]> {
    return (await this.findWhereIn("partyRecordRef", partyIds)).map(partyFloorClearRecordFromRow);
  }

  async findRecordsByPartyIdsUpToFloor(
    partyIds: PartyId[],
    floor: number
  ): Promise<LadderPartyFloorClearRecord[]> {
    if (partyIds.length === 0) {
      return [];
    }
    const { rows } = await this.pgPool.query(
      format(
        `SELECT * FROM ${tableName} WHERE party_record_ref IN (%L) AND floor <= %L;`,
        partyIds,
        floor
      )
    );
    return (toCamelCase(rows) as unknown as LadderPartyFloorClearRecordRow[]).map(
      partyFloorClearRecordFromRow
    );
  }

  async insert(record: LadderPartyFloorClearRecord, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName}
           (id, party_record_ref, floor, time_spent_on_floor, control_scheme, cleared_at)
         VALUES (%L, %L, %L, %L, %L, to_timestamp(%L::double precision / 1000.0));`,
        record.id,
        record.partyRecordRef,
        record.floor,
        record.timeSpentOnFloor,
        CHARACTER_CONTROL_SCHEME_STRINGS[record.controlScheme],
        record.clearedAt
      )
    );
  }
}

// exported for the board queries, which select these rows with joins onto parties and games and so
// live in the strategy rather than here — the mapping is still this table's business
export function partyFloorClearRecordFromRow(
  row: LadderPartyFloorClearRecordRow
): LadderPartyFloorClearRecord {
  // the column is NOT NULL, so a missing value means the row was written by something that bypassed
  // the write path rather than a legitimately absent date
  const clearedAt = timestampToMs(row.clearedAt);
  invariant(clearedAt !== undefined, "floor clear record is missing cleared_at");
  return {
    id: row.id as LadderPartyFloorClearRecordId,
    partyRecordRef: row.partyRecordRef as PartyId,
    floor: row.floor,
    timeSpentOnFloor: Number(row.timeSpentOnFloor) as Milliseconds,
    controlScheme: controlSchemeFromString(row.controlScheme),
    clearedAt,
  };
}

export const ladderPartyFloorClearRecordsRepo = new LadderPartyFloorClearRecordsRepo(
  pgPool,
  tableName
);

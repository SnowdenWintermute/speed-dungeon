import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import { LadderPartyRecord, PartyFate, PartyId } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_PARTY_RECORDS;

export interface LadderPartyRecordRow {
  id: string;
  gameRecordId: string;
  name: string;
  fateType: string | null;
  fateTimestamp: Date | string | null;
  deepestFloorReached: number;
}

type LadderPartyRecordInsert = Omit<
  LadderPartyRecord,
  "characterRecordRefs" | "partyFloorClearRecordRefs"
>;

class LadderPartyRecordsRepo extends DatabaseRepository<LadderPartyRecordRow> {
  async insert(record: LadderPartyRecordInsert, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName}
           (id, game_record_id, name, fate_type, fate_timestamp, deepest_floor_reached)
         VALUES (%L, %L, %L, %L, ${fateTimestampSql(record.fateOption)}, %L);`,
        record.id,
        record.gameRecordId,
        record.name,
        record.fateOption?.type ?? null,
        record.deepestFloorReached
      )
    );
  }

  async updateFateAndProgress(
    id: PartyId,
    fateOption: PartyFate | undefined,
    deepestFloorReached: number,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `UPDATE ${tableName}
         SET fate_type = %L, fate_timestamp = ${fateTimestampSql(fateOption)}, deepest_floor_reached = %L
         WHERE id = %L;`,
        fateOption?.type ?? null,
        deepestFloorReached,
        id
      )
    );
  }
}

function fateTimestampSql(fateOption: PartyFate | undefined) {
  if (fateOption === undefined) {
    return "NULL";
  }
  return format("to_timestamp(%L::double precision / 1000.0)", fateOption.timestamp);
}

export const ladderPartyRecordsRepo = new LadderPartyRecordsRepo(pgPool, tableName);

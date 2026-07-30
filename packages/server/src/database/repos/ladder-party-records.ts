import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  GameId,
  LadderPartyRecord,
  PartyFate,
  PartyFateType,
  PartyId,
  PartyName,
} from "@speed-dungeon/common";
import { timestampToMs } from "../row-conversions.js";

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
  async findRecordById(id: PartyId): Promise<LadderPartyRecord | undefined> {
    const row = await this.findById(id);
    if (row === undefined) {
      return undefined;
    }
    return rowToRecord(row);
  }

  async findRecordsByIds(ids: PartyId[]): Promise<LadderPartyRecord[]> {
    return (await this.findWhereIn("id", ids)).map(rowToRecord);
  }

  async findRecordsByGameIds(gameIds: GameId[]): Promise<LadderPartyRecord[]> {
    return (await this.findWhereIn("gameRecordId", gameIds)).map(rowToRecord);
  }

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

function rowToRecord(row: LadderPartyRecordRow): LadderPartyRecord {
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

function fateTimestampSql(fateOption: PartyFate | undefined) {
  if (fateOption === undefined) {
    return "NULL";
  }
  return format("to_timestamp(%L::double precision / 1000.0)", fateOption.timestamp);
}

export const ladderPartyRecordsRepo = new LadderPartyRecordsRepo(pgPool, tableName);

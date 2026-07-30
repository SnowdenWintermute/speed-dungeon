import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import { toCamelCase } from "../utils.js";
import { IdentityProviderId, LadderParticipantRecord, Username } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS;

export interface LadderParticipantRecordRow {
  id: IdentityProviderId;
  lastKnownUsername: string | null;
}

class LadderParticipantRecordsRepo extends DatabaseRepository<LadderParticipantRecordRow> {
  async findRecordsByIds(ids: IdentityProviderId[]): Promise<LadderParticipantRecord[]> {
    return (await this.findWhereIn("id", ids)).map(rowToRecord);
  }

  async findAllIds(): Promise<IdentityProviderId[]> {
    const { rows } = await this.pgPool.query(`SELECT id FROM ${tableName};`);
    return (rows as { id: IdentityProviderId }[]).map((row) => row.id);
  }

  async insert(record: LadderParticipantRecord, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName} (id, last_known_username)
         VALUES (%L, %L)
         ON CONFLICT (id) DO NOTHING;`,
        record.id,
        record.lastKnownUsername ?? null
      )
    );
  }

  async updateLastKnownUsername(
    id: IdentityProviderId,
    username: string,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(`UPDATE ${tableName} SET last_known_username = %L WHERE id = %L;`, username, id)
    );
  }

  async findById(
    id: string,
    executor: Queryable = this.pgPool
  ): Promise<LadderParticipantRecordRow | undefined> {
    const { rows } = await executor.query(format(`SELECT * FROM ${tableName} WHERE id = %L;`, id));
    if (!rows[0]) {
      return undefined;
    }
    return toCamelCase(rows)[0] as unknown as LadderParticipantRecordRow;
  }
}

function rowToRecord(row: LadderParticipantRecordRow): LadderParticipantRecord {
  return {
    id: row.id,
    lastKnownUsername: (row.lastKnownUsername as Username) ?? undefined,
  };
}

export const ladderParticipantRecordsRepo = new LadderParticipantRecordsRepo(pgPool, tableName);

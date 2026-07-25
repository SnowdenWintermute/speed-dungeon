import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import { toCamelCase } from "../utils.js";
import { IdentityProviderId, LadderParticipantRecord } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS;

export interface LadderParticipantRecordRow {
  id: IdentityProviderId;
  lastKnownUsername: string | null;
}

class LadderParticipantRecordsRepo extends DatabaseRepository<LadderParticipantRecordRow> {
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

export const ladderParticipantRecordsRepo = new LadderParticipantRecordsRepo(pgPool, tableName);

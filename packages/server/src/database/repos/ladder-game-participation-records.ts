import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  GameId,
  IdentityProviderId,
  LadderGameParticipationRecord,
  Milliseconds,
} from "@speed-dungeon/common";
import { timestampToMs } from "../row-conversions.js";

const tableName = RESOURCE_NAMES.LADDER_GAME_PARTICIPATION_RECORDS;

export interface LadderGameParticipationRecordRow {
  gameRecordId: string;
  participantRecordId: string;
  abandonedAt: Date | string | null;
}

export class LadderGameParticipationRecordsRepo extends DatabaseRepository<LadderGameParticipationRecordRow> {
  async findRecordsByGameId(gameRecordId: GameId): Promise<LadderGameParticipationRecord[]> {
    const rows = await this.find("gameRecordId", gameRecordId);
    return (rows ?? []).map(rowToRecord);
  }

  async insert(
    gameRecordId: GameId,
    userId: IdentityProviderId,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `INSERT INTO ${tableName} (game_record_id, participant_record_id)
         VALUES (%L, %L)
         ON CONFLICT (game_record_id, participant_record_id) DO NOTHING;`,
        gameRecordId,
        userId
      )
    );
  }

  async updateAbandonedAt(
    gameRecordId: GameId,
    userId: IdentityProviderId,
    timestamp: Milliseconds,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `UPDATE ${tableName}
         SET abandoned_at = to_timestamp(%L::double precision / 1000.0)
         WHERE game_record_id = %L AND participant_record_id = %L;`,
        timestamp,
        gameRecordId,
        userId
      )
    );
  }
}

function rowToRecord(row: LadderGameParticipationRecordRow): LadderGameParticipationRecord {
  return {
    gameRecordId: row.gameRecordId as GameId,
    participantRecordId: row.participantRecordId as unknown as IdentityProviderId,
    abandonedAtOption: timestampToMs(row.abandonedAt),
  };
}

export const ladderGameParticipationRecordsRepo = new LadderGameParticipationRecordsRepo(
  pgPool,
  tableName
);

import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import { LadderGameRecordId, LadderParticipantRecordId } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_GAME_PARTICIPANT_RECORDS;

export interface LadderGameParticipantRecordRow {
  gameRecordId: string;
  participantRecordId: string;
}

class LadderGameParticipantRecordsRepo extends DatabaseRepository<LadderGameParticipantRecordRow> {
  async insert(
    gameRecordId: LadderGameRecordId,
    participantRecordId: LadderParticipantRecordId,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `INSERT INTO ${tableName} (game_record_id, participant_record_id)
         VALUES (%L, %L)
         ON CONFLICT (game_record_id, participant_record_id) DO NOTHING;`,
        gameRecordId,
        participantRecordId
      )
    );
  }
}

export const ladderGameParticipantRecordsRepo = new LadderGameParticipantRecordsRepo(
  pgPool,
  tableName
);

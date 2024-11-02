import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";

export type RaceGameParticipantRecord = {
  id: number;
  partyId: number;
  userId: string; // UUID
};

const tableName = RESOURCE_NAMES.RACE_GAME_PARTICIPANT_RECORDS;

class RaceGameParticipantRecordRepo extends DatabaseRepository<RaceGameParticipantRecord> {
  async insert(partyId: string, userId: number) {
    await this.pgPool.query(
      format(
        `INSERT INTO race_game_participant_records
        (party_id, user_id)
        VALUES (%L, %L) RETURNING *;`,
        partyId,
        userId
      )
    );
  }
}

export const raceGameParticipantRecordsRepo = new RaceGameParticipantRecordRepo(pgPool, tableName);

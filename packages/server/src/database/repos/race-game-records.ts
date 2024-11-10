import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { ERROR_MESSAGES, RaceGameAggregatedRecord, SpeedDungeonGame } from "@speed-dungeon/common";
import { raceGamePartyRecordsRepo } from "./race-game-party-records.js";
import { SERVER_VERSION } from "../../server-version.js";
import { env } from "../../validate-env.js";

export type RaceGameRecord = {
  id: number;
  gameName: string;
  gameVersion: string;
  timeOfCompletion: number | Date;
};

export type RaceGameParticipant = {
  id: number;
  partyId: number;
  userId: string; // UUID
};

const tableName = RESOURCE_NAMES.RACE_GAME_RECORDS;

const AGGREGATE_PARTY_RECORD_QUERY = `
json_object_agg(
  pr.party_name,
  json_build_object(
    'party_id', pr.id,
    'party_fate', pr.party_fate,
    'party_fate_recorded_at', pr.party_fate_recorded_at,
    'is_winner', pr.is_winner,
    'deepest_floor', pr.deepest_floor,
    'characters', (
      SELECT json_object_agg(
        cr.id,
        json_build_object(
          'character_id', cr.id,
          'character_name', cr.character_name,
          'level', cr.level,
          'combatant_class', cr.combatant_class,
          'id_of_controlling_user', cr.id_of_controlling_user
        )
      )
      FROM race_game_character_records cr
      WHERE cr.party_id = pr.id
    )
  )
)
`;

class RaceGameRecordRepo extends DatabaseRepository<RaceGameRecord> {
  async dropAll() {
    if (env.NODE_ENV !== "test")
      throw new Error("Don't try to delete all game records when not in test env");
    await this.pgPool.query("DELETE FROM race_game_records");
  }

  async insertGameRecord(game: SpeedDungeonGame) {
    if (!game.timeStarted) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_records
         (id, game_name, game_version)
         VALUES (%L, %L, %L) RETURNING *;`,
        game.id,
        game.name,
        SERVER_VERSION
      )
    );

    const partyRecordPromises: Promise<Error | undefined>[] = [];

    for (const party of Object.values(game.adventuringParties))
      partyRecordPromises.push(raceGamePartyRecordsRepo.insert(game, party));

    const results = await Promise.all(partyRecordPromises);
    const errorMessages: string[] = [];
    for (const result of results) {
      if (result instanceof Error) {
        errorMessages.push(result.message);
      }
    }
    if (errorMessages.length) return new Error(errorMessages.join(", "));
  }

  async getCountByUserId(userId: number) {
    const { rows } = await this.pgPool.query(
      format(
        `
        SELECT COUNT(DISTINCT gr.id) AS games_participated
        FROM race_game_records gr
        JOIN race_game_party_records pr ON pr.game_id = gr.id
        JOIN race_game_participant_records prt ON prt.party_id = pr.id
        WHERE prt.user_id = %L;
        `,
        userId
      )
    );
    return parseInt(rows[0]["games_participated"]);
  }

  async markGameAsCompleted(gameId: string) {
    await this.pgPool.query(
      format(
        `
        UPDATE race_game_records
        SET time_of_completion = %L
        WHERE id = %L;
       `,
        new Date(),
        gameId
      )
    );
  }

  async findAggregatedGameRecordById(gameId: string) {
    const { rows } = await this.pgPool.query(
      format(
        `
        SELECT 
        gr.id AS game_id,
        gr.game_name,
        gr.game_version,
        gr.time_started,
        gr.time_of_completion,
        ${AGGREGATE_PARTY_RECORD_QUERY} AS parties
        FROM 
        race_game_records gr
        JOIN 
        race_game_party_records pr ON pr.game_id = gr.id
        WHERE 
        gr.id IN (
          SELECT DISTINCT gr.id AS game_id
          FROM race_game_records gr
          JOIN race_game_party_records pr ON pr.game_id = gr.id
          JOIN race_game_participant_records prt ON prt.party_id = pr.id
          WHERE gr.id = %L)
          GROUP BY 
          gr.id;
          `,
        gameId
      )
    );

    return rows[0] as unknown as RaceGameAggregatedRecord;
  }

  async findAllGamesByUserId(userId: number) {
    const { rows } = await this.pgPool.query(
      format(
        `
        SELECT 
        gr.id AS game_id,
        gr.game_name,
        gr.game_version,
        gr.time_started,
        gr.time_of_completion,
        ${AGGREGATE_PARTY_RECORD_QUERY} AS parties
        FROM 
        race_game_records gr
        JOIN 
        race_game_party_records pr ON pr.game_id = gr.id
        WHERE 
        gr.id IN (
          SELECT DISTINCT gr.id AS game_id
          FROM race_game_records gr
          JOIN race_game_party_records pr ON pr.game_id = gr.id
          JOIN race_game_participant_records prt ON prt.party_id = pr.id
          WHERE prt.user_id = %L)
          GROUP BY 
          gr.id;
          `,
        userId
      )
    );
    return rows as unknown as RaceGameAggregatedRecord[];
  }

  async getPageOfGameRecordsByUserId(userId: number, pageSize: number, pageNumber: number) {
    const { rows } = await this.pgPool.query(
      format(
        `
        SELECT 
        gr.id AS game_id,
        gr.game_name,
        gr.game_version,
        gr.time_of_completion,
        ${AGGREGATE_PARTY_RECORD_QUERY} AS parties
        FROM 
        race_game_records gr
        JOIN 
        race_game_party_records pr ON pr.game_id = gr.id
        WHERE 
        gr.id IN (
          SELECT DISTINCT gr.id AS game_id
          FROM race_game_records gr
          JOIN race_game_party_records pr ON pr.game_id = gr.id
          JOIN race_game_participant_records prt ON prt.party_id = pr.id
          WHERE prt.user_id = %L
        )
        GROUP BY 
        gr.id
        ORDER BY 
        gr.time_started DESC
        LIMIT %L
        OFFSET (%L)::INTEGER * (%L)::INTEGER;
        `,
        userId,
        pageSize,
        pageNumber,
        pageSize
      )
    );
    return rows as unknown as RaceGameAggregatedRecord[];
  }

  async getNumberOfWinsAndLosses(userId: number) {
    const { rows } = await pgPool.query(
      format(
        `
        SELECT 
        COUNT(CASE WHEN pr.is_winner THEN 1 END) AS wins,
        COUNT(CASE WHEN NOT pr.is_winner THEN 1 END) AS losses
        FROM 
        race_game_records gr
        JOIN 
        race_game_party_records pr ON pr.game_id = gr.id
        JOIN 
        race_game_participant_records prt ON prt.party_id = pr.id
        WHERE 
        prt.user_id = %L
        GROUP BY 
        prt.user_id;
        `,
        userId
      )
    );

    return rows[0] as unknown as { wins: number; losses: number };
  }
}

export const raceGameRecordsRepo = new RaceGameRecordRepo(pgPool, tableName);

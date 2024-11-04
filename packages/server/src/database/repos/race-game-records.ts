import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
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

export type RaceGameAggregatedRecordList = {
  game_id: string;
  game_name: string;
  game_version: string;
  time_of_completion: null | number;
  parties: {
    [partyName: string]: {
      party_id: string;
      party_name: string;
      duration_to_wipe: null | number;
      duration_to_escape: null | number;
      is_winner: boolean;
      characters: {
        [characterId: string]: {
          character_id: string;
          character_name: string;
          level: number;
          combatant_class: string;
          id_of_controlling_user: number;
        };
      };
    };
  };
}[];

const tableName = RESOURCE_NAMES.RACE_GAME_RECORDS;

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
      partyRecordPromises.push(raceGamePartyRecordsRepo.insert(game, party, false));

    const results = await Promise.all(partyRecordPromises);
    const errorMessages: string[] = [];
    for (const result of results) {
      if (result instanceof Error) errorMessages.push(result.message);
    }
    if (errorMessages.length) return new Error(errorMessages.join(", "));
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

  async findAllGamesByUserId(userId: number) {
    const { rows } = await this.pgPool.query(
      format(
        `
        SELECT 
        gr.id AS game_id,
        gr.game_name,
        gr.game_version,
        gr.time_of_completion,
        json_object_agg(
          pr.party_name,
          json_build_object(
            'party_id', pr.id,
            'duration_to_wipe', pr.duration_to_wipe,
            'duration_to_escape', pr.duration_to_escape,
            'is_winner', pr.is_winner,
            'characters', (
              SELECT json_object_agg(
                cr.id,
                json_build_object(
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
        ) AS parties
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
    return rows as unknown as RaceGameAggregatedRecordList;
  }
}

export const raceGameRecordsRepo = new RaceGameRecordRepo(pgPool, tableName);

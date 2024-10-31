import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { SERVER_VERSION } from "../../index.js";
import { Combatant, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { raceGamePartyRecordsRepo } from "./race-game-party-records.js";

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

class RaceGameRecordRepo extends DatabaseRepository<RaceGameRecord> {
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
}

export const raceGameRecordsRepo = new RaceGameRecordRepo(pgPool, tableName);

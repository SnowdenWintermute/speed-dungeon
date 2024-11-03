import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { AdventuringParty, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { raceGameCharacterRecordsRepo } from "./race-game-character-records.js";
import { raceGameParticipantRecordsRepo } from "./race-game-participants-repo.js";
import { getUserIdsByUsername } from "../get-user-ids-by-username.js";

export type RaceGamePartyRecord = {
  id: number;
  gameRecordId: number;
  partyName: string;
  durationToWipe: null | number;
  durationToEscape: null | number;
  isWinner: boolean;
};

const tableName = RESOURCE_NAMES.RACE_GAME_PARTY_RECORDS;

class RaceGamePartyRecordRepo extends DatabaseRepository<RaceGamePartyRecord> {
  async insert(game: SpeedDungeonGame, party: AdventuringParty, isWinner: boolean) {
    const userIdsByUsernameResult = await getUserIdsByUsername(Object.keys(game.players));
    if (userIdsByUsernameResult instanceof Error) return userIdsByUsernameResult;
    if (game.timeStarted === null) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);

    const durationToWipe = party.timeOfWipe ? party.timeOfWipe - game.timeStarted : null;
    const durationToEscape = party.timeOfEscape ? party.timeOfEscape - game.timeStarted : null;

    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_party_records
           (id, game_id, party_name, duration_to_wipe, duration_to_escape, is_winner)
           VALUES (%L, %L, %L, %L, %L, %L) RETURNING *;`,
        party.id,
        game.id,
        party.name,
        durationToWipe,
        durationToEscape,
        isWinner
      )
    );

    for (const character of Object.values(party.characters)) {
      const controllingPlayerIdOption = character.combatantProperties.controllingPlayer
        ? userIdsByUsernameResult[character.combatantProperties.controllingPlayer]
        : null;
      await raceGameCharacterRecordsRepo.insert(
        character,
        party.id,
        controllingPlayerIdOption || null
      );
    }

    for (const username of party.playerUsernames) {
      const userIdOption = userIdsByUsernameResult[username];
      if (userIdOption === undefined) {
        console.error("failed to find expected user id by username when saving a race game record");
        continue;
      }
      raceGameParticipantRecordsRepo.insert(party.id, userIdOption);
    }
  }

  async update(partyRecord: RaceGamePartyRecord) {
    await this.pgPool.query(
      format(
        `UPDATE race_game_party_records
         SET party_name = %L, duration_to_wipe = %L, duration_to_escape = %L, is_winner = %L 
         WHERE id = %L;`,
        partyRecord.partyName,
        partyRecord.durationToWipe,
        partyRecord.durationToEscape,
        partyRecord.isWinner,
        partyRecord.id
      )
    );
  }
}

export const raceGamePartyRecordsRepo = new RaceGamePartyRecordRepo(pgPool, tableName);

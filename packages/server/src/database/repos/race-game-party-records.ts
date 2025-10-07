import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import {
  AdventuringParty,
  ERROR_MESSAGES,
  PartyFate,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { raceGameCharacterRecordsRepo } from "./race-game-character-records.js";
import { raceGameParticipantRecordsRepo } from "./race-game-participants-repo.js";
import { getUserIdsByUsername } from "../get-user-ids-by-username.js";

export type RaceGamePartyRecord = {
  id: number;
  gameRecordId: number;
  partyName: string;
  partyFate: PartyFate;
  partyFateRecordedAt: null | string;
  isWinner: boolean;
  deepestFloor: number;
};

const tableName = RESOURCE_NAMES.RACE_GAME_PARTY_RECORDS;

class RaceGamePartyRecordRepo extends DatabaseRepository<RaceGamePartyRecord> {
  async insert(game: SpeedDungeonGame, party: AdventuringParty) {
    const userIdsByUsernameResult = await getUserIdsByUsername(Object.keys(game.players));
    if (userIdsByUsernameResult instanceof Error) return userIdsByUsernameResult;
    if (game.timeStarted === null) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);

    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_party_records
           (id, game_id, party_name)
           VALUES (%L, %L, %L) RETURNING *;`,
        party.id,
        game.id,
        party.name
      )
    );

    const partyCharacters = party.combatantManager.getPartyMemberCombatants();

    for (const character of partyCharacters) {
      const { controllerName } = character.combatantProperties.controlledBy;
      const controllingPlayerIdOption = userIdsByUsernameResult[controllerName] || null;
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
         SET party_name = %L, party_fate = %L, party_fate_recorded_at = %L, is_winner = %L, deepest_floor = %L
         WHERE id = %L;`,
        partyRecord.partyName,
        partyRecord.partyFate,
        partyRecord.partyFateRecordedAt,
        partyRecord.isWinner,
        partyRecord.deepestFloor,
        partyRecord.id
      )
    );
  }
}

export const raceGamePartyRecordsRepo = new RaceGamePartyRecordRepo(pgPool, tableName);

import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { AdventuringParty, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { env } from "../../validate-env.js";
import { userIdsByUsernameSchema } from "../../validation/user-ids-by-username-schema.js";
import { raceGameCharacterRecordsRepo } from "./race-game-character-records.js";
import { raceGameParticipantRecordsRepo } from "./race-game-participants-repo.js";

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
           (party_name, duration_to_wipe, duration_to_escape, is_winner)
           VALUES (%L, %L, %L, %L) WHERE id = %L;`,
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

async function getUserIdsByUsername(usernames: string[]) {
  const cookies = `internal=${env.INTERNAL_SERVICES_SECRET};`;
  const usernamesQueryString = `?usernames=${usernames.join(",")}`;
  const userIdsResponse = await fetch(
    `${env.AUTH_SERVER_URL}/internal/user_ids${usernamesQueryString}`,
    {
      method: "GET",
      headers: {
        Cookie: cookies,
      },
    }
  );

  const responseBody = await userIdsResponse.json();
  const validationResult = userIdsByUsernameSchema.safeParse(responseBody);
  if (validationResult.error) return new Error(JSON.stringify(validationResult.error.format()));
  const playerUserIdsByUsername = validationResult.data;

  return playerUserIdsByUsername;
}

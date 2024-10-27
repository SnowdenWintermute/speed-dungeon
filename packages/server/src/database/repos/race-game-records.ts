import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { SERVER_VERSION } from "../../index.js";
import {
  AdventuringParty,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  formatCombatantClassName,
} from "@speed-dungeon/common";
import { env } from "../../validate-env.js";
import { userIdsByUsernameSchema } from "../../validation/user-ids-by-username-schema.js";

export type RaceGameRecord = {
  id: number;
  gameName: string;
  gameVersion: string;
  timeOfCompletion: number | Date;
};

export type RaceGamePartyRecord = {
  id: number;
  gameRecordId: number;
  partyName: string;
  durationToWipe: null | number;
  durationToEscape: null | number;
  isWinner: boolean;
};

export type RaceGameParticipant = {
  id: number;
  partyId: number;
  userId: string; // UUID
};

export type RaceGameCharacterRecord = {
  id: number;
  partyId: number;
  characterName: string;
  level: number;
  combatantClass: string;
  idOfControllingUser: string; // UUID
};

const tableName = RESOURCE_NAMES.RACE_GAME_RECORDS;

class RaceGameRecordRepo extends DatabaseRepository<RaceGameRecord> {
  async insertGameRecord(game: SpeedDungeonGame) {
    if (!game.timeStarted) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_records
         (game_name, game_version)
         VALUES (%L, %L) RETURNING *;`,
        game.name,
        SERVER_VERSION
      )
    );

    const gameRecord = rows[0] as unknown as RaceGameRecord;
    const gameRecordId = gameRecord.id;

    const partyRecordPromises: Promise<Error | undefined>[] = [];

    for (const party of Object.values(game.adventuringParties))
      partyRecordPromises.push(this.insertPartyRecord(game, party, false));

    await Promise.all(partyRecordPromises);

    return gameRecordId;
  }

  async insertPartyRecord(game: SpeedDungeonGame, party: AdventuringParty, isWinner: boolean) {
    const userIdsByUsernameResult = await getUserIdsByUsername(Object.keys(game.players));
    if (userIdsByUsernameResult instanceof Error) return userIdsByUsernameResult;
    console.log("got ids: ", userIdsByUsernameResult);
    if (game.timeStarted === null) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
    if (game.gameRecordId === null) return new Error("Expected gameRecordId was missing");

    const durationToWipe = party.timeOfWipe ? party.timeOfWipe - game.timeStarted : null;
    const durationToEscape = party.timeOfEscape ? party.timeOfEscape - game.timeStarted : null;

    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_party_records
           (game_record_id, party_name, duration_to_wipe, duration_to_escape, is_winner)
           VALUES (%L, %L, %L, %L, %L) RETURNING *;`,
        game.gameRecordId,
        party.name,
        durationToWipe,
        durationToEscape,
        isWinner
      )
    );

    const partyRecord = rows[0] as unknown as RaceGamePartyRecord;
    const partyRecordId = partyRecord.id;

    for (const character of Object.values(party.characters)) {
      const controllingPlayerIdOption = character.combatantProperties.controllingPlayer
        ? userIdsByUsernameResult[character.combatantProperties.controllingPlayer]
        : null;
      const { rows } = await this.pgPool.query(
        format(
          `INSERT INTO race_game_character_records
             (party_id, character_name, level, combatant_class, id_of_controlling_user)
             VALUES (%L, %L, %L, %L, %L) RETURNING *;`,
          partyRecordId,
          character.entityProperties.name,
          character.combatantProperties.level,
          formatCombatantClassName(character.combatantProperties.combatantClass),
          controllingPlayerIdOption || null
        )
      );
    }

    for (const username of party.playerUsernames) {
      const userIdOption = userIdsByUsernameResult[username];
      if (userIdOption === undefined) {
        console.error("failed to find expected user id by username when saving a race game record");
        continue;
      }
      format(
        `INSERT INTO race_game_participant_records
           (party_id, user_id)
           VALUES (%L, %L) RETURNING *;`,
        partyRecordId,
        userIdOption
      );
    }
  }
}

export const raceGameRecordsRepo = new RaceGameRecordRepo(pgPool, tableName);

function calculateRaceGameWinningParty(game: SpeedDungeonGame, timeStarted: number) {
  let winningPartyName: string | null = null;
  let bestEscapeDuration: null | number = null;

  for (const party of Object.values(game.adventuringParties)) {
    if (!party.timeOfEscape) continue;
    const escapeDuration = party.timeOfEscape - timeStarted;
    if (bestEscapeDuration === null || bestEscapeDuration > escapeDuration) {
      bestEscapeDuration = escapeDuration;
      winningPartyName = party.name;
    }
  }

  return winningPartyName;
}

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

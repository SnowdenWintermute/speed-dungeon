import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import getSingleUserIdByUsername from "../../database/get-single-user-id-by-username.js";
import {
  ERROR_MESSAGES,
  RACE_GAME_RECORDS_PAGE_SIZE,
  RaceGameAggregatedRecord,
  SanitizedRaceGameAggregatedRecord,
  SanitizedRacePartyAggregatedRecord,
} from "@speed-dungeon/common";
import { raceGameRecordsRepo } from "../../database/repos/race-game-records.js";
import { getUsernamesByUserIds } from "../../database/get-usernames-by-user-ids.js";

export default async function getUserRankedRaceHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usernameOption = req.params.username;
    if (!usernameOption) {
      console.error("no username provided");
      return next([new CustomError(ERROR_MESSAGES.SERVER_GENERIC, 500)]);
    }
    // get user id from username in route path
    const userIdResult = await getSingleUserIdByUsername(usernameOption);
    if (userIdResult instanceof Error) {
      console.error(userIdResult);
      return next([new CustomError(ERROR_MESSAGES.SERVER_GENERIC, 500)]);
    }

    let { page } = req.query;
    if (typeof page !== "string") return next([new CustomError("Invalid query string", 400)]);

    const pageNumber = parseInt(page);
    if (pageNumber < 1) return next([new CustomError("Page number must not be negative", 400)]);

    const games = await raceGameRecordsRepo.getPageOfGameRecordsByUserId(
      userIdResult,
      RACE_GAME_RECORDS_PAGE_SIZE,
      // this is where we'll finally convert to zero index pages so the client can think of the first page as page "1"
      // even though it really is page 0
      pageNumber - 1
    );

    const sanitizedGamesResult = await sanitizeGameHistoryList(games);
    if (sanitizedGamesResult instanceof Error) {
      console.error(sanitizedGamesResult);
      return next([new CustomError(ERROR_MESSAGES.SERVER_GENERIC, 500)]);
    }

    res.json(sanitizedGamesResult);
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}

async function sanitizeGameHistoryList(games: RaceGameAggregatedRecord[]) {
  const userIds: Set<number> = new Set();
  for (const game of games)
    for (const party of Object.values(game.parties))
      for (const character of Object.values(party.characters))
        userIds.add(character.id_of_controlling_user);

  const usernamesById = await getUsernamesByUserIds(Array.from(userIds));
  if (usernamesById instanceof Error) return usernamesById;

  const sanitizedGames: SanitizedRaceGameAggregatedRecord[] = [];

  for (const game of games) {
    const sanitizedGame = new SanitizedRaceGameAggregatedRecord(game);
    for (const [partyName, party] of Object.entries(game.parties)) {
      const sanitizedParty = new SanitizedRacePartyAggregatedRecord(party);
      for (const character of Object.values(party.characters)) {
        sanitizedParty.characters[character.character_id] = {
          character_name: character.character_name,
          level: character.level,
          combatant_class: character.combatant_class,
          usernameOfControllingUser: usernamesById[character.id_of_controlling_user] || "unknown",
        };
      }
      sanitizedGame.parties[partyName] = sanitizedParty;
    }
    sanitizedGames.push(sanitizedGame);
  }

  sanitizedGames.sort((a, b) => (b.time_of_completion || 0) - (a.time_of_completion || 0));

  return sanitizedGames;
}

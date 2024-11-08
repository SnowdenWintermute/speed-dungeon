import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import getSingleUserIdByUsername from "../../database/get-single-user-id-by-username.js";
import { ERROR_MESSAGES, RACE_GAME_RECORDS_PAGE_SIZE } from "@speed-dungeon/common";
import { raceGameRecordsRepo } from "../../database/repos/race-game-records.js";

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

    res.json(games);
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}

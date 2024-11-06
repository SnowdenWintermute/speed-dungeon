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

    const page = req.params.page ? parseInt(req.params.page) : null;
    if (typeof page !== "number") {
      return next([new CustomError("No page provided", 500)]);
    }

    const games = await raceGameRecordsRepo.getPageOfGameRecordsByUserId(
      userIdResult,
      RACE_GAME_RECORDS_PAGE_SIZE,
      page
    );

    res.json(games);
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}

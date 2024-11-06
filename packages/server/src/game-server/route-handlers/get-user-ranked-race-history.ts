import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import getSingleUserIdByUsername from "../../database/get-single-user-id-by-username.js";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { raceGameRecordsRepo } from "../../database/repos/race-game-records.js";

export default async function getUserRankedRaceHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("hit game history");
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

    const count = await raceGameRecordsRepo.getCountByUserId(userIdResult);

    // res.json(count);
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}

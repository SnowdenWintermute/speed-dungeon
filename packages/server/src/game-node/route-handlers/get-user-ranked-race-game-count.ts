import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import { raceGameRecordsRepo } from "../../database/repos/race-game-records.js";

export default async function getUserRankedRaceGameCountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: number = res.locals.userId; // expected from middleware

    const count = await raceGameRecordsRepo.getCountByUserId(userId);

    res.json(count);
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}

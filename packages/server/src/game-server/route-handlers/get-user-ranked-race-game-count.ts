import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import getAuthSession from "../utils/get-auth-session.js";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export default async function getUserRankedRaceGameCountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("hit game count");
  try {
    // get user id from username in route path
    // get the count of all their games
  } catch (error) {
    return next([new CustomError("Something went wrong", 500)]);
  }
}

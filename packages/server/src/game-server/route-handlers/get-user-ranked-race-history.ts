import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";

export default async function getUserRankedRaceHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("hit game history");
  try {
    // get user id from username in route path
    // get the page of records specified in the route
  } catch (error) {
    return next([new CustomError("Something went wrong", 500)]);
  }
}

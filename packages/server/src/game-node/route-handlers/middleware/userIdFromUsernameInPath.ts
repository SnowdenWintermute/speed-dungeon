import { NextFunction, Request, Response } from "express";
import CustomError from "../../../express-error-handler/CustomError.js";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import getSingleUserIdByUsername from "../../../database/get-single-user-id-by-username.js";

export default async function userIdFromUserameInPath(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const usernameOption = req.params.username;
  if (!usernameOption) {
    console.error("no username provided");
    return next([new CustomError(ERROR_MESSAGES.SERVER_GENERIC, 500)]);
  }

  const userIdResult = await getSingleUserIdByUsername(usernameOption);
  if (userIdResult instanceof Error) {
    console.error(userIdResult);
    return next([new CustomError(ERROR_MESSAGES.SERVER_GENERIC, 500)]);
  }

  res.locals.userId = userIdResult;

  next();
}

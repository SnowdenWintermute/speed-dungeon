import { NextFunction, Request, Response } from "express";
import CustomError from "./CustomError";
import { CustomErrorDetails, ERROR_MESSAGES } from "@speed-dungeon/common";

export default function expressErrorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let status: undefined | number;
  let errors: CustomErrorDetails[] | undefined;
  if (error[0] instanceof CustomError) {
    status = error[0].status;
    errors = error.map((customError: CustomError) => {
      const errorToReturn: CustomErrorDetails = {
        message: customError.message,
      };
      if (customError.field) errorToReturn.field = customError.field;
      return errorToReturn;
    });
  } else console.error("non-custom error in handler: ", error);

  let jsonToSend: CustomErrorDetails[] | { message: string; error: any }[];
  if (errors) jsonToSend = errors;
  else jsonToSend = [{ message: ERROR_MESSAGES.SERVER_GENERIC, error }];

  res.status(status || error.status || 500).json(jsonToSend);
}

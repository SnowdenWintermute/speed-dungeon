import { NextFunction, Request, Response } from "express";

export default async function getUserWinsAndLossesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  throw new Error("not implemented");
  // try {
  //   const userId: number = res.locals.userId; // expected from middleware
  //   const winslosses = await raceGameRecordsRepo.getNumberOfWinsAndLosses(userId);

  //   res.json(winslosses);
  // } catch (error) {
  //   console.error(error);
  //   return next([new CustomError("Something went wrong", 500)]);
  // }
}

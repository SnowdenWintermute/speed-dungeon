import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressErrorHandler from "./express-error-handler/index.js";
import getCharacterLevelLadderPageHandler from "./game-server/route-handlers/get-character-level-ladder-page.js";
import getUserRankedRaceGameCountHandler from "./game-server/route-handlers/get-user-ranked-race-game-count.js";
import getUserRankedRaceHistoryHandler from "./game-server/route-handlers/get-user-ranked-race-history.js";
import getUserIdFromUsernameInPath from "./game-server/route-handlers/middleware/userIdFromUsernameInPath.js";
import getUserWinsAndLossesHandler from "./game-server/route-handlers/get-user-wins-and-losses.js";
import getUserProfileHandler from "./game-server/route-handlers/get-user-profile.js";
import { env } from "./validate-env.js";
import { getAssetHandler } from "./asset-handlers/get-asset-handler.js";

export default function appRoute(...args: string[]) {
  const baseRoute = env.NODE_ENV === "production" ? "/api" : "";
  return baseRoute.concat(...args);
}

export function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10kb" }));

  app.use(cookieParser());
  app.use(
    cors({
      origin: env.FRONT_END_URL,
      credentials: true,
    })
  );

  app.get(appRoute("/"), (_: Request, res: Response) => res.send("this is the api server"));
  app.get(appRoute("/assets/:folderpath/:filepath"), getAssetHandler);
  app.get(appRoute("/profiles/:username"), getUserIdFromUsernameInPath, getUserProfileHandler);
  app.get(appRoute("/ladders/level/:page"), getCharacterLevelLadderPageHandler);
  app.get(
    appRoute("/game-records/count/:username"),
    getUserIdFromUsernameInPath,
    getUserRankedRaceGameCountHandler
  );
  app.get(
    appRoute("/game-records/:username"),
    getUserIdFromUsernameInPath,
    getUserRankedRaceHistoryHandler
  );
  app.get(
    appRoute("/game-records/win-loss-records/:username"),
    getUserIdFromUsernameInPath,
    getUserWinsAndLossesHandler
  );

  app.all(appRoute("*"), (req: Request, _: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
  });

  app.use(expressErrorHandler);
  return app;
}

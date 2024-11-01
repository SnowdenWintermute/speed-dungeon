import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressErrorHandler from "./express-error-handler/index.js";
import getCharacterLevelLadderPageHandler from "./game-server/route-handlers/get-character-level-ladder-page.js";

export function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.get("/", (_: Request, res: Response) => res.send("this is the api server"));
  app.get("/ladders/level/:page", getCharacterLevelLadderPageHandler);

  app.all("*", (req: Request, _: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
  });

  app.use(expressErrorHandler);
  return app;
}

import express, { Request, Response, NextFunction } from "express";
import expressErrorHandler from "./express-error-handler/index.js";
import cookieParser from "cookie-parser";

export default function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/", (_: Request, res: Response) => res.send("this is the api server"));

  app.all("*", (req: Request, _: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
  });

  app.use(expressErrorHandler);
  return app;
}

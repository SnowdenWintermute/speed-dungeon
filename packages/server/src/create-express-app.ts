import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressErrorHandler from "./express-error-handler/index.js";
import { env } from "./validate-env.js";
import { appRoute } from "./app-route.js";

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

  const isProduction = env.NODE_ENV === "production";

  app.get(appRoute({ isProduction }, "/"), (_: Request, res: Response) =>
    res.send("this is the api server")
  );
  // app.all(appRoute("*"), (req: Request, _: Response, next: NextFunction) => {
  //   const err = new Error(`Route ${req.originalUrl} not found`) as any;
  //   err.status = 404;
  //   next(err);
  // });

  app.use(expressErrorHandler);
  return app;
}

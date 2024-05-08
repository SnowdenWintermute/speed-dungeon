import express, { Request, Response, NextFunction } from "express";
import errorHandler from "./error-handler";

export default function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10kb" }));

  app.get("/", (_: Request, res: Response) =>
    res.send("this is the api server")
  );

  app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.status = 404;
    next(err);
  });

  app.use(errorHandler);
  return app;
}

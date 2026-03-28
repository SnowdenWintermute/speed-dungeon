import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

const FRONT_END_URL = "TODO - modify if needed for testing";

export function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10kb" }));

  app.use(cookieParser());
  app.use(
    cors({
      origin: FRONT_END_URL,
      credentials: true,
    })
  );

  return app;
}

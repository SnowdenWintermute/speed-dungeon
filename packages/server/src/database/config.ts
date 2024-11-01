import * as dotenv from "dotenv";
import { env } from "../validate-env.js";
dotenv.config();

export const pgOptions = {
  host: env.POSTGRES_HOST,
  port: 5433,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};

export const TEST_DB_NAME = "test-db";

export const pgOptionsTestDB = {
  host: "localhost",
  port: 5433,
  database: TEST_DB_NAME,
  user: "postgres",
  password: "postgres",
};

import * as dotenv from "dotenv";
import { env } from "../validate-env.js";
dotenv.config();

export const pgOptions = {
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};

export const TEST_DB_NAME = "test_db";

export const pgOptionsTestDB = {
  host: "localhost",
  port: env.POSTGRES_PORT,
  database: TEST_DB_NAME,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};

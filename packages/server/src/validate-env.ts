import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { cleanEnv, num, str, url } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  FRONT_END_URL: url(),
  AUTH_SERVER_URL: url(),
  POSTGRES_HOST: str(),
  POSTGRES_DB: str(),
  POSTGRES_PORT: num(),
  POSTGRES_USER: str(),
  POSTGRES_PASSWORD: str(),
  DATABASE_URL: url(),
  INTERNAL_SERVICES_SECRET: str(),
  VALKEY_URL: url(),
});

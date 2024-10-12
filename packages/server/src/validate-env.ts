import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { cleanEnv, str, url } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  FRONT_END_URL: url(),
  AUTH_SERVER_URL: url(),
  POSTGRES_HOST: str(),
  POSTGRES_DB: str(),
  POSTGRES_USER: str(),
  POSTGRES_PASSWORD: str(),
  DATABASE_URL: url(),
});

import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { bool, cleanEnv, num, str, url } from "envalid";

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
  TOKENS_SECRET: str(),
  VALKEY_URL: url(),
  MANUAL_TEST_MODE: bool({ default: false }),
  RUN_MIGRATIONS_ON_BOOT: bool({ default: true }),
  GAME_SERVER_PUBLIC_URL: url(),
});

if (env.MANUAL_TEST_MODE && env.isProduction) {
  throw new Error(
    "MANUAL_TEST_MODE is on with NODE_ENV=production. It serves fixture characters and scripted dungeons."
  );
}

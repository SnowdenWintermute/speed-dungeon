import "./load-env-file.js";
import { bool, cleanEnv, num, str, url } from "envalid";

// shared by the lobby and game server roles. the asset server validates its own
// smaller schema so a missing DATABASE_URL cannot stop its container from booting.
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
});

if (env.MANUAL_TEST_MODE && env.isProduction) {
  throw new Error(
    "MANUAL_TEST_MODE is on with NODE_ENV=production. It serves fixture characters and scripted dungeons."
  );
}

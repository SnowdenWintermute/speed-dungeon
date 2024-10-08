import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { cleanEnv, str, url } from "envalid";

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  FRONT_END_URL: url(),
  AUTH_SERVER_URL: url(),
});

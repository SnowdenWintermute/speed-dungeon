import "./load-env-file.js";
import { cleanEnv, num, str, url } from "envalid";

export const assetServerEnv = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  FRONT_END_URL: url(),
  ASSET_SERVER_PORT: num({ default: 8100 }),
  ASSETS_DIRECTORY: str({ default: "./assets" }),
});

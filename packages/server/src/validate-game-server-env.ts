import "./load-env-file.js";
import { cleanEnv, num, str, url } from "envalid";

export const gameServerEnv = cleanEnv(process.env, {
  GAME_SERVER_PORT: num({ default: 8090 }),
  GAME_SERVER_NAME: str(),
  // the public url clients are told to connect to, not this container's address
  GAME_SERVER_PUBLIC_URL: url(),
  // includes the /api prefix when the asset server runs with NODE_ENV=production
  ASSET_SERVER_URL: url(),
});

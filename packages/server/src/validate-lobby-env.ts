import "./load-env-file.js";
import { bool, cleanEnv, num } from "envalid";

export const lobbyEnv = cleanEnv(process.env, {
  LOBBY_PORT: num({ default: 8080 }),
  RUN_MIGRATIONS_ON_BOOT: bool({ default: true }),
});

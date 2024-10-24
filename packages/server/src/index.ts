import createExpressApp from "./create-express-app.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";
import { pgPool } from "./singletons.js";
import { pgOptions } from "./database/config.js";
import fs from "fs";
import { valkeyManager } from "./kv-store/index.js";
import { playerCharactersRepo } from "./database/repos/player-characters.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";

// we care about the version because when we save characters and games
// we want to know what version of the game they were from
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
if (!packageJson.version || typeof packageJson.version !== "string") {
  console.error("unknown version number");
  process.exit(1);
}
export const SERVER_VERSION: string = packageJson.version;

const PORT = 8080;

export let gameServer: undefined | GameServer = undefined;

pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.log(`speed dungeon server on port ${PORT}`);

  gameServer = new GameServer(io);
});

export function getGameServer() {
  if (!gameServer) throw new Error("GameServer is not initialized yet!");
  return gameServer;
}

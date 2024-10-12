import createExpressApp from "./create-express-app.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";
import { pgPool } from "./singletons.js";
import { pgOptions } from "./database/config.js";
import fs from "fs";
import { playerCharactersRepo } from "./database/repos/player-characters.js";

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

const retrieved = await playerCharactersRepo.findById("ea11e933-67c8-476b-8d07-a83a25cf7094");
if (retrieved?.combatantProperties) {
  console.log(retrieved.name);
  const combatant = retrieved.combatantProperties;
  console.log(combatant);
}
if (retrieved === undefined) process.exit(1);

export const STOCK_MONSTER = retrieved;

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.log(`speed dungeon server on port ${PORT}`);

  gameServer = new GameServer(io);
});

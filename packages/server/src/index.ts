import { createExpressApp } from "./create-express-app.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { GameServer } from "./game-server/index.js";
import { env } from "./validate-env.js";
import { gameServer } from "./singletons/index.js";
import { pgPool } from "./singletons/pg-pool.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import { runMigrations } from "./database/run-migrations.js";

const PORT = 8080;

await runMigrations();
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(listening, {
    cors: { origin: env.FRONT_END_URL, credentials: true },
  });

  console.info(`speed dungeon server on port ${PORT}`);

  gameServer.current = new GameServer(io);
});

import { createExpressApp } from "./create-express-app.js";
import { EntityNotFoundError } from "@speed-dungeon/common";
import { idGenerator } from "./singletons/index.js";
import { pgPool } from "./singletons/pg-pool.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import { runMigrations } from "./database/run-migrations.js";
import { LobbyServerNode } from "./lobby-server/index.js";
import { GameServerNode } from "./game-server/index.js";

const LOBBY_PORT = 8080;
const GAME_SERVER_PORT = 8090;

await runMigrations();
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const lobbyServerNode = new LobbyServerNode();

const expressApp = createExpressApp();
const httpServer = expressApp.listen(LOBBY_PORT, async () => {
  // const io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(httpServer, {
  //   cors: { origin: env.FRONT_END_URL, credentials: true },
  // });

  console.info(`speed dungeon server on port ${LOBBY_PORT}`);

  try {
    // gameServer.current = new GameServerNode(io, expressApp, PORT);
    lobbyServerNode.createLobbyServer(httpServer);
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      const note = idGenerator.getHistoryNote(error.entityId);
      console.info(error.message, error.entityId, note);
    } else {
      throw error;
    }
  }
});

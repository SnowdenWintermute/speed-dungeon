import { createExpressApp } from "../create-express-app.js";
import { runMigrations } from "../database/run-migrations.js";
import { loadLadderIntoKvStore } from "../kv-store/utils.js";
import { LobbyServerNode } from "../lobby-node/index.js";
import { lobbyEnv } from "../validate-lobby-env.js";
import { bootstrapSharedServices } from "./bootstrap.js";

if (lobbyEnv.RUN_MIGRATIONS_ON_BOOT) {
  await runMigrations();
}

const services = await bootstrapSharedServices();

// deletes and rebuilds the ladder key, so only the single lobby may run it
await loadLadderIntoKvStore();

const expressApp = createExpressApp();
const httpServer = expressApp.listen(lobbyEnv.LOBBY_PORT, async () => {
  console.info(`lobby server on port ${lobbyEnv.LOBBY_PORT}`);

  await new LobbyServerNode().createServer(
    httpServer,
    services.gameSessionStoreService,
    services.gameServerRegistry,
    services.userGlobalGameSessionStore,
    services.crossServerBroadcasterService,
    services.gameServerSessionClaimTokenCodec,
    services.guestReconnectionTokenCodec,
    services.profileService
  );
});

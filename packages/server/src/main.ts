import { createExpressApp } from "./create-express-app.js";
import {
  CrossServerBroadcasterService,
  GameServerName,
  GameStateUpdate,
  ServerCommand,
  SodiumHelpers,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  AssetServer,
} from "@speed-dungeon/common";
import { AssetServerRouter } from "./asset-server/index.js";
import { NodeFileSystemAssetStore } from "./services/assets/stores/node-file-system.js";
import { ValkeyUserGlobalGameSessionStore } from "./services/valkey-user-global-game-session-store.js";
import { ValkeyCrossServerBroadcaster } from "./services/valkey-cross-server-broadcaster.js";
import { pgPool } from "./singletons/pg-pool.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import { runMigrations } from "./database/run-migrations.js";
import { LobbyServerNode } from "./lobby-node/index.js";
import { GameServerNode } from "./game-node/index.js";
import { createServer } from "http";
import { GuestSessionReconnectionToken } from "@speed-dungeon/common";
import { DatabaseProfileService } from "./game-node/services/profiles.js";
import { speedDungeonProfilesRepo } from "./database/repos/speed-dungeon-profiles.js";
import { ValkeyGameSessionStoreService } from "./services/valkey-game-session-store-service.js";
import { ValkeyGameServerRegistry } from "./services/valkey-game-server-registry.js";
import { env } from "./validate-env.js";

const LOBBY_PORT = 8080;
export const GAME_SERVER_NAME = "Lindblum Test Game Server" as GameServerName;
const GAME_SERVER_PORT = 8090;

if (env.RUN_MIGRATIONS_ON_BOOT) {
  await runMigrations();
}
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const lobbyServerNode = new LobbyServerNode();
const gameServerNode = new GameServerNode();

const gameSessionStoreService = new ValkeyGameSessionStoreService(valkeyManager.context);

const userGlobalGameSessionStore = new ValkeyUserGlobalGameSessionStore(valkeyManager.context);

const gameServerRegistry = new ValkeyGameServerRegistry(valkeyManager.context);

// for sending ladder rank global messages from the originating game server to all clients
// on all servers
const lobbyCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate, ServerCommand> =
  new ValkeyCrossServerBroadcaster(valkeyManager.context.client);
const gameCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate, ServerCommand> =
  new ValkeyCrossServerBroadcaster(valkeyManager.context.client);

const tokensSecret = env.TOKENS_SECRET;
await SodiumHelpers.assertUsableSecret(tokensSecret);
const gameServerSessionClaimTokenCodec =
  new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(tokensSecret);
const guestReconnectionTokenCodec = new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(
  tokensSecret
);

const profileService = new DatabaseProfileService(speedDungeonProfilesRepo);

const fsAssetStore = new NodeFileSystemAssetStore("./assets");
const assetServer = new AssetServer(fsAssetStore);
await assetServer.initialize();

const expressApp = createExpressApp();
new AssetServerRouter(assetServer, fsAssetStore).attachRouter(expressApp, {
  isProduction: env.isProduction,
});
const httpServer = expressApp.listen(LOBBY_PORT, async () => {
  console.info(`lobby server on port ${LOBBY_PORT}`);

  lobbyServerNode.createServer(
    httpServer,
    gameSessionStoreService,
    userGlobalGameSessionStore,
    lobbyCrossServerBroadcaster,
    gameServerSessionClaimTokenCodec,
    guestReconnectionTokenCodec,
    profileService
  );
});

const gameHttpServer = createServer();
gameHttpServer.listen(GAME_SERVER_PORT, () => {
  console.info(`game server on port ${GAME_SERVER_PORT}`);
  gameServerNode.createServer(
    GAME_SERVER_NAME,
    gameHttpServer,
    profileService,
    gameSessionStoreService,
    userGlobalGameSessionStore,
    gameCrossServerBroadcaster,
    gameServerSessionClaimTokenCodec,
    guestReconnectionTokenCodec,
    assetServer,
    gameServerRegistry
  );
});

import { createExpressApp } from "./create-express-app.js";
import {
  CrossServerBroadcasterService,
  GameServerName,
  GameStateUpdate,
  InMemoryCrossServerBroadcaster,
  InMemoryCrossServerBroadcastBus,
  InMemoryGameSessionStoreService,
  InMemoryReconnectionForwardingStoreService,
  OpaqueEncryptionSessionClaimTokenCodec,
  SodiumHelpers,
} from "@speed-dungeon/common";
import { pgPool } from "./singletons/pg-pool.js";
import { pgOptions } from "./database/config.js";
import { valkeyManager } from "./kv-store/index.js";
import { loadLadderIntoKvStore } from "./kv-store/utils.js";
import { runMigrations } from "./database/run-migrations.js";
import { LobbyServerNode } from "./lobby-node/index.js";
import { GameServerNode } from "./game-node/index.js";
import { createServer } from "http";

const LOBBY_PORT = 8080;
export const GAME_SERVER_NAME = "Lindblum Test Server" as GameServerName;
const GAME_SERVER_PORT = 8090;

await runMigrations();
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const lobbyServerNode = new LobbyServerNode();
const gameServerNode = new GameServerNode();

// @TODO - make valkey versions
const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();
const gameSessionStoreService = new InMemoryGameSessionStoreService();

// for sending ladder rank global messages from the originating game server to all clients
// on all servers
const crossServerBroadcastBus = new InMemoryCrossServerBroadcastBus<GameStateUpdate>();
const lobbyCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate> =
  new InMemoryCrossServerBroadcaster(crossServerBroadcastBus);
const gameCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate> =
  new InMemoryCrossServerBroadcaster(crossServerBroadcastBus);

const sessionClaimTokenSecret = await SodiumHelpers.createSecret();
const gameServerSessionClaimTokenCodec = new OpaqueEncryptionSessionClaimTokenCodec(
  sessionClaimTokenSecret
);

const expressApp = createExpressApp();
const httpServer = expressApp.listen(LOBBY_PORT, async () => {
  console.info(`lobby server on port ${LOBBY_PORT}`);

  lobbyServerNode.createServer(
    httpServer,
    reconnectionForwardingStoreService,
    gameSessionStoreService,
    lobbyCrossServerBroadcaster,
    gameServerSessionClaimTokenCodec
  );
});

const gameHttpServer = createServer();
gameHttpServer.listen(GAME_SERVER_PORT, () => {
  console.info(`game server on port ${GAME_SERVER_PORT}`);
  gameServerNode.createServer(
    GAME_SERVER_NAME,
    gameHttpServer,
    expressApp,
    reconnectionForwardingStoreService,
    gameSessionStoreService,
    gameCrossServerBroadcaster,
    gameServerSessionClaimTokenCodec
  );
});

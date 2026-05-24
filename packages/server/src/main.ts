import { createExpressApp } from "./create-express-app.js";
import {
  CrossServerBroadcasterService,
  GameServerName,
  GameStateUpdate,
  InMemoryCrossServerBroadcaster,
  InMemoryCrossServerBroadcastBus,
  InMemoryGameSessionStoreService,
  ServerCommand,
  SodiumHelpers,
  InMemoryGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
} from "@speed-dungeon/common";
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

const LOBBY_PORT = 8080;
export const GAME_SERVER_NAME = "Lindblum Test Game Server" as GameServerName;
const GAME_SERVER_PORT = 8090;

await runMigrations();
pgPool.connect(pgOptions);
await valkeyManager.context.connect();

await loadLadderIntoKvStore();

const lobbyServerNode = new LobbyServerNode();
const gameServerNode = new GameServerNode();

// @TODO - make valkey versions
const gameSessionStoreService = new InMemoryGameSessionStoreService();
const globalGameSessionStore = new InMemoryGlobalGameSessionStore();

// for sending ladder rank global messages from the originating game server to all clients
// on all servers
const crossServerBroadcastBus = new InMemoryCrossServerBroadcastBus<
  GameStateUpdate,
  ServerCommand
>();
const lobbyCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate, ServerCommand> =
  new InMemoryCrossServerBroadcaster(crossServerBroadcastBus);
const gameCrossServerBroadcaster: CrossServerBroadcasterService<GameStateUpdate, ServerCommand> =
  new InMemoryCrossServerBroadcaster(crossServerBroadcastBus);

const tokensSecret = await SodiumHelpers.createSecret();
const gameServerSessionClaimTokenCodec =
  new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(tokensSecret);
const guestReconnectionTokenCodec = new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(
  tokensSecret
);

const profileService = new DatabaseProfileService(speedDungeonProfilesRepo);

const expressApp = createExpressApp();
const httpServer = expressApp.listen(LOBBY_PORT, async () => {
  console.info(`lobby server on port ${LOBBY_PORT}`);

  lobbyServerNode.createServer(
    httpServer,
    gameSessionStoreService,
    globalGameSessionStore,
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
    expressApp,
    profileService,
    gameSessionStoreService,
    globalGameSessionStore,
    gameCrossServerBroadcaster,
    gameServerSessionClaimTokenCodec,
    guestReconnectionTokenCodec
  );
});

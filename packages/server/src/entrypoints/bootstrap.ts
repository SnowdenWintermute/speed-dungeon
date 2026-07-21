import {
  CrossServerBroadcasterService,
  GameServerSessionClaimToken,
  GameStateUpdate,
  GuestSessionReconnectionToken,
  OpaqueEncryptionTokenCodec,
  ServerCommand,
  SodiumHelpers,
} from "@speed-dungeon/common";
import { pgOptions } from "../database/config.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { DatabaseProfileService } from "../game-node/services/profiles.js";
import { valkeyManager } from "../kv-store/index.js";
import { ValkeyCrossServerBroadcaster } from "../services/valkey-cross-server-broadcaster.js";
import { ValkeyGameServerRegistry } from "../services/valkey-game-server-registry.js";
import { ValkeyGameSessionStoreService } from "../services/valkey-game-session-store-service.js";
import { ValkeyUserGlobalGameSessionStore } from "../services/valkey-user-global-game-session-store.js";
import { pgPool } from "../singletons/pg-pool.js";
import { env } from "../validate-env.js";

export async function bootstrapSharedServices() {
  pgPool.connect(pgOptions);
  await valkeyManager.context.connect();

  const tokensSecret = env.TOKENS_SECRET;
  await SodiumHelpers.assertUsableSecret(tokensSecret);

  const crossServerBroadcasterService: CrossServerBroadcasterService<
    GameStateUpdate,
    ServerCommand
  > = new ValkeyCrossServerBroadcaster(valkeyManager.context.client);

  return {
    gameSessionStoreService: new ValkeyGameSessionStoreService(valkeyManager.context),
    userGlobalGameSessionStore: new ValkeyUserGlobalGameSessionStore(valkeyManager.context),
    gameServerRegistry: new ValkeyGameServerRegistry(valkeyManager.context),
    crossServerBroadcasterService,
    gameServerSessionClaimTokenCodec: new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(
      tokensSecret
    ),
    guestReconnectionTokenCodec: new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(
      tokensSecret
    ),
    profileService: new DatabaseProfileService(speedDungeonProfilesRepo),
  };
}

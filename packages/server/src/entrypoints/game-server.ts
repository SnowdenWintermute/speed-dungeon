import {
  GameplayAssetFactsSource,
  GameServerName,
  HttpGameplayAssetFactsSource,
  retryWithExponentialBackoff,
} from "@speed-dungeon/common";
import { createServer } from "http";
import {
  ASSET_FACTS_FETCH_BASE_DELAY_MS,
  ASSET_FACTS_FETCH_MAX_ATTEMPTS,
} from "../consts.js";
import { GameServerNode } from "../game-node/index.js";
import { gameServerEnv } from "../validate-game-server-env.js";
import { bootstrapSharedServices } from "./bootstrap.js";

const services = await bootstrapSharedServices();

const httpAssetFactsSource = new HttpGameplayAssetFactsSource(gameServerEnv.ASSET_SERVER_URL);
const gameplayAssetFactsSource: GameplayAssetFactsSource = {
  getGameplayAssetFacts: () =>
    retryWithExponentialBackoff(
      {
        maxAttempts: ASSET_FACTS_FETCH_MAX_ATTEMPTS,
        baseDelayMs: ASSET_FACTS_FETCH_BASE_DELAY_MS,
        onAttempt: (attempt, maxAttempts) =>
          console.info(`fetching gameplay asset facts (attempt ${attempt} of ${maxAttempts})`),
      },
      () => httpAssetFactsSource.getGameplayAssetFacts()
    ),
};

const gameServerNode = new GameServerNode();

const httpServer = createServer();
httpServer.listen(gameServerEnv.GAME_SERVER_PORT, async () => {
  console.info(
    `game server "${gameServerEnv.GAME_SERVER_NAME}" on port ${gameServerEnv.GAME_SERVER_PORT}`
  );

  try {
    await gameServerNode.createServer(
      gameServerEnv.GAME_SERVER_NAME as GameServerName,
      httpServer,
      services.profileService,
      services.gameSessionStoreService,
      services.userGlobalGameSessionStore,
      services.crossServerBroadcasterService,
      services.gameServerSessionClaimTokenCodec,
      services.guestReconnectionTokenCodec,
      gameplayAssetFactsSource,
      services.gameServerRegistry
    );
  } catch (error) {
    // a game server nobody can be handed off to should not sit there looking healthy
    console.error("game server failed to start:", error);
    process.exit(1);
  }
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await gameServerNode.shutDown();
    process.exit(0);
  });
}

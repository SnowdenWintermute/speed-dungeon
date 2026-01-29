import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { QUERY_PARAMS } from "../../../query-params.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToHostJoinedGameServer } from "./host-joined-game-server.js";

export async function testGameSetupToBothPlayersJoined(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient, joinerConnectionInstructions } =
    await testGameSetupToHostJoinedGameServer(clientEndpointFactory);

  const joinerQueryParams = {
    name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
    value: joinerConnectionInstructions.encryptedSessionClaimToken,
  };

  joinerClient.initializeEndpoint(
    clientEndpointFactory.createClientEndpoint(joinerConnectionInstructions.url, {
      queryParams: [joinerQueryParams],
    })
  );

  const joinerClientJoinedGameServerMessageListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameFullUpdate
  );

  const reconnectTokenMessageListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.CacheGuestSessionReconnectionToken
  );

  const gameStartedMessageListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameStarted
  );

  await joinerClient.connect();

  const reconnectionTokenMessage = await reconnectTokenMessageListener;
  const joinedGameServerMessage = await joinerClientJoinedGameServerMessageListener;

  joinerClient.game = joinedGameServerMessage.data.game;
  joinerClient.guestReconnectionToken = reconnectionTokenMessage.data.token;

  const gameStartedMessage = await gameStartedMessageListener;
  expect(gameStartedMessage.data.timeStarted).toBeDefined();

  return { hostClient, joinerClient };
}

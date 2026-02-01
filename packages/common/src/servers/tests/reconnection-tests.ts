import { it, expect } from "vitest";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { testGameSetupToBothPlayersJoined } from "./fixtures/checkpoints/two-players-joined-game-server.js";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "../game-server/reconnection/index.js";
import { testGameSetupToSuccessfulGameReconnect } from "./fixtures/checkpoints/successful-game-reconnect.js";
import { invariant } from "../../utils/index.js";
import { QUERY_PARAMS } from "../query-params.js";
import { TEST_LOBBY_URL } from "./fixtures/index.js";
import { TimeMachine } from "../../test-utils/time-machine.js";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "./fixtures/test-connection-endpoint-factories.js";

export function reconnectionTests(
  clientEndpointFactory: ClientEndpointFactory,
  timeMachine: TimeMachine,
  authSessionIds?: TestAuthSessionIds
) {
  it("reconnect token reuse", async () => {
    if (authSessionIds?.joinerAuthSessionId) {
      // auth users don't use guest reconnect tokens
      return;
    }

    const { joinerClient, usedJoinerGuestReconnectionToken } =
      await testGameSetupToSuccessfulGameReconnect(clientEndpointFactory, authSessionIds);

    await joinerClient.close();

    const queryParams = {
      name: QUERY_PARAMS.GUEST_RECONNECTION_TOKEN,
      value: usedJoinerGuestReconnectionToken || "",
    };

    const endpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
      queryParams: [queryParams],
      headers: { cookie: `id=${authSessionIds?.joinerAuthSessionId}` },
    });

    joinerClient.initializeEndpoint(endpoint);

    const joinerClientInitialJoinUsernameMessageListener = joinerClient.awaitGameStateUpdate(
      GameStateUpdateType.OnConnection,
      { expiredReconnection: true }
    );

    await joinerClient.connect();

    const joinerClientInitialJoinUsernameMessage =
      await joinerClientInitialJoinUsernameMessageListener;

    expect(joinerClientInitialJoinUsernameMessage.data.username).toBeDefined();
  });

  it("reconnect after timeout", async () => {
    timeMachine.start();
    const { joinerClient } = await testGameSetupToBothPlayersJoined(clientEndpointFactory);

    await joinerClient.close();

    timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

    invariant(joinerClient.guestReconnectionToken !== null);

    const joinerRejoinLobbyParams = {
      name: QUERY_PARAMS.GUEST_RECONNECTION_TOKEN,
      value: joinerClient.guestReconnectionToken,
    };

    joinerClient.initializeEndpoint(
      clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
        queryParams: [joinerRejoinLobbyParams],
      })
    );

    const joinerClientInitialJoinUsernameMessageListener = joinerClient.awaitGameStateUpdate(
      GameStateUpdateType.OnConnection,
      { expiredReconnection: true }
    );

    const joinerClientInitialJoinUsernameMessage =
      await joinerClientInitialJoinUsernameMessageListener;
    expect(joinerClientInitialJoinUsernameMessage.data.username).toBeDefined();
  });
}

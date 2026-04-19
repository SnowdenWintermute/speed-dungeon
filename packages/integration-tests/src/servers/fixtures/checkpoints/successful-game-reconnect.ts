import { GameStateUpdateType, QUERY_PARAMS } from "@speed-dungeon/common";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "../test-connection-endpoint-factories.js";
import { testGameSetupToGameHandoff } from "./game-handoff.js";

export async function testGameSetupToSuccessfulGameReconnect(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  const { hostClient, joinerClient, hostConnectionInstructions, joinerConnectionInstructions } =
    await testGameSetupToGameHandoff(clientEndpointFactory, authSessionIds);

  await hostClient.connectToGameServer(
    clientEndpointFactory,
    hostConnectionInstructions,
    authSessionIds?.hostAuthSessionId || ""
  );
  await joinerClient.connectToGameServer(
    clientEndpointFactory,
    joinerConnectionInstructions,
    authSessionIds?.joinerAuthSessionId || ""
  );

  await joinerClient.close();

  // invariant(joinerClient.guestReconnectionToken !== null);

  const joinerRejoinLobbyParams = {
    name: QUERY_PARAMS.GUEST_RECONNECTION_TOKEN,
    value: joinerClient.guestReconnectionToken || "",
  };

  const usedJoinerGuestReconnectionToken = structuredClone(joinerClient.guestReconnectionToken);

  joinerClient.initializeEndpoint(
    clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
      queryParams: [joinerRejoinLobbyParams],
      headers: { cookie: `id=${authSessionIds?.joinerAuthSessionId}` },
    })
  );

  const joinerClientRejoinConnectionInstructionsListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  await joinerClient.connect();

  const joinerRejoinConnectionInstructionsMessage =
    await joinerClientRejoinConnectionInstructionsListener;
  const rejoinConnectionInstructions =
    joinerRejoinConnectionInstructionsMessage.data.connectionInstructions;

  await joinerClient.close();

  await joinerClient.connectToGameServer(
    clientEndpointFactory,
    rejoinConnectionInstructions,
    authSessionIds?.joinerAuthSessionId || ""
  );

  return {
    joinerClient,
    hostClient,
    usedJoinerGuestReconnectionToken,
  };
}

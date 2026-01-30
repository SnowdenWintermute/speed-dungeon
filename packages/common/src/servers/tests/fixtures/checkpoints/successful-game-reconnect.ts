import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { invariant } from "../../../../utils/index.js";
import { QUERY_PARAMS } from "../../../query-params.js";
import { TEST_LOBBY_URL } from "../index.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToGameHandoff } from "./game-handoff.js";

export async function testGameSetupToSuccessfulGameReconnect(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient, hostConnectionInstructions, joinerConnectionInstructions } =
    await testGameSetupToGameHandoff(clientEndpointFactory);

  await hostClient.connectToGameServer(clientEndpointFactory, hostConnectionInstructions);
  await joinerClient.connectToGameServer(clientEndpointFactory, joinerConnectionInstructions);

  await joinerClient.close();

  invariant(joinerClient.guestReconnectionToken !== null);

  const joinerRejoinLobbyParams = {
    name: QUERY_PARAMS.GUEST_RECONNECTION_TOKEN,
    value: joinerClient.guestReconnectionToken,
  };

  const usedJoinerGuestReconnectionToken = structuredClone(joinerClient.guestReconnectionToken);

  joinerClient.initializeEndpoint(
    clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
      queryParams: [joinerRejoinLobbyParams],
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

  await joinerClient.connectToGameServer(clientEndpointFactory, rejoinConnectionInstructions);

  return {
    joinerClient,
    hostClient,
    usedJoinerGuestReconnectionToken,
  };
}

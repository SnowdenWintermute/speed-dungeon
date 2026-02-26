import { ClientIntentType, GameStateUpdateType } from "@speed-dungeon/common";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "../test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInPartyWithCharacters } from "./two-players-in-party-with-characters.js";

export async function testGameSetupToGameHandoff(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  const { hostClient, joinerClient } = await testGameSetupToTwoPlayersInPartyWithCharacters(
    clientEndpointFactory,
    authSessionIds
  );

  const joinerClientHostReadiedListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );
  await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    },
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );

  await joinerClientHostReadiedListener;

  const hostGameHandoffListener = hostClient.awaitGameStateUpdate(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const joinerGameHandoffListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameServerConnectionInstructions
  );

  await joinerClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    },
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );

  const hostConnectionInstructions = await hostGameHandoffListener;
  hostClient.sessionClaimToken =
    hostConnectionInstructions.data.connectionInstructions.encryptedSessionClaimToken;
  const joinerConnectionInstructions = await joinerGameHandoffListener;
  joinerClient.sessionClaimToken =
    joinerConnectionInstructions.data.connectionInstructions.encryptedSessionClaimToken;

  await hostClient.close();
  await joinerClient.close();

  return {
    hostClient,
    joinerClient,
    hostConnectionInstructions: hostConnectionInstructions.data.connectionInstructions,
    joinerConnectionInstructions: joinerConnectionInstructions.data.connectionInstructions,
  };
}

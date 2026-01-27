import { ClientIntentType } from "../../../../packets/client-intents.js";
import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInPartyWithCharacters } from "./two-players-in-party-with-characters.js";

export async function testGameSetupToGameHandoff(clientEndpointFactory: ClientEndpointFactory) {
  const { hostClient, joinerClient } =
    await testGameSetupToTwoPlayersInPartyWithCharacters(clientEndpointFactory);

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
  const joinerConnectionInstructions = await joinerGameHandoffListener;

  await hostClient.close();
  await joinerClient.close();

  return {
    hostClient,
    joinerClient,
    hostConnectionInstructions: hostConnectionInstructions.data.connectionInstructions,
    joinerConnectionInstructions: joinerConnectionInstructions.data.connectionInstructions,
  };
}

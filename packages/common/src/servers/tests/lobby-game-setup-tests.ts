import { it } from "vitest";
import { ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "./fixtures/test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInParty } from "./fixtures/checkpoints/two-players-in-party.js";
import { testGameSetupToTwoPlayersJoinedLobbyGame } from "./fixtures/checkpoints/two-players-joined-lobby-game.js";

export function lobbyGameSetupTests(
  clientEndpointFactory: ClientEndpointFactory,
  authSessionIds?: TestAuthSessionIds
) {
  it("minimum parties", async () => {
    const { hostClient, joinerClient } = await testGameSetupToTwoPlayersJoinedLobbyGame(
      clientEndpointFactory,
      authSessionIds
    );

    await hostClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );

    await hostClient.close();
    await joinerClient.close();
  });

  it("minimum characters", async () => {
    const { hostClient, joinerClient } =
      await testGameSetupToTwoPlayersInParty(clientEndpointFactory);
    await hostClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );

    await joinerClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );

    await hostClient.close();
    await joinerClient.close();
  });
}

import { it, expect } from "vitest";
import { ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { testGameSetupToBothPlayersJoined } from "./fixtures/checkpoints/two-players-joined-game-server.js";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "../game-server/reconnection/index.js";
import { testGameSetupToHostJoinedGameServer } from "./fixtures/checkpoints/host-joined-game-server.js";
import { testGameSetupToSuccessfulGameReconnect } from "./fixtures/checkpoints/successful-game-reconnect.js";
import { ClientEndpointFactory } from "./fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../../test-utils/time-machine.js";

export function awaitReconnectionGameInputLockTests(
  clientEndpointFactory: ClientEndpointFactory,
  timeMachine: TimeMachine
) {
  it("input before game start", async () => {
    const { hostClient } = await testGameSetupToHostJoinedGameServer(clientEndpointFactory);
    await hostClient.sendMessageAndAwaitReplyType(
      {
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      },
      GameStateUpdateType.ErrorMessage
    );
  });

  it("input while awaiting reconnect", async () => {
    const { hostClient, joinerClient } =
      await testGameSetupToBothPlayersJoined(clientEndpointFactory);
    await hostClient.close();

    joinerClient.sendMessageAndAwaitReplyType(
      {
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      },
      GameStateUpdateType.ErrorMessage
    );
  });

  it("input after reconnect", async () => {
    const { hostClient } = await testGameSetupToSuccessfulGameReconnect(clientEndpointFactory);

    await hostClient.sendMessageAndAwaitReplyType(
      {
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      },
      GameStateUpdateType.PlayerToggledReadyToDescendOrExplore
    );
  });

  it("input after reconnect timeout", async () => {
    timeMachine.start();
    const { hostClient, joinerClient } =
      await testGameSetupToBothPlayersJoined(clientEndpointFactory);

    await joinerClient.close();

    timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

    const message = await hostClient.sendMessageAndAwaitReplyType(
      {
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      },
      GameStateUpdateType.PlayerToggledReadyToDescendOrExplore
    );

    expect(message.type).toBe(GameStateUpdateType.PlayerToggledReadyToDescendOrExplore);
  });
}

import {
  ClientIntentType,
  GameStateUpdateType,
  RECONNECTION_OPPORTUNITY_TIMEOUT_MS,
} from "@speed-dungeon/common";
import {
  ClientEndpointFactory,
  TestAuthSessionIds,
} from "./fixtures/test-connection-endpoint-factories.js";
import { testGameSetupToHostJoinedGameServer } from "./fixtures/checkpoints/host-joined-game-server.js";
import { testGameSetupToBothPlayersJoined } from "./fixtures/checkpoints/two-players-joined-game-server.js";
import { testGameSetupToSuccessfulGameReconnect } from "./fixtures/checkpoints/successful-game-reconnect.js";
import { TimeMachine } from "../test-utils/time-machine.js";

export function awaitReconnectionGameInputLockTests(
  clientEndpointFactory: ClientEndpointFactory,
  timeMachine: TimeMachine,
  authSessionIds?: TestAuthSessionIds
) {
  it("input before game start", async () => {
    const { hostClient } = await testGameSetupToHostJoinedGameServer(
      clientEndpointFactory,
      authSessionIds
    );
    await hostClient.sendMessageAndAwaitReplyType(
      {
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      },
      GameStateUpdateType.ErrorMessage
    );
  });

  it("input while awaiting reconnect", async () => {
    const { hostClient, joinerClient } = await testGameSetupToBothPlayersJoined(
      clientEndpointFactory,
      authSessionIds
    );
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
    const { hostClient } = await testGameSetupToSuccessfulGameReconnect(
      clientEndpointFactory,
      authSessionIds
    );

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
    const { hostClient, joinerClient } = await testGameSetupToBothPlayersJoined(
      clientEndpointFactory,
      authSessionIds
    );

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

import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { ClientIntentType } from "@speed-dungeon/common";

export async function testRetryLostInitialConnectionInstructions(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  // auth user is sent connection instructions
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
  alpha.clientApplication.lobbyClientRef.get().dispatchIntent({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });
  // disconnects after starting game but before getting connection instructinos
  await alpha.clientApplication.lobbyClientRef.get().close();
  await expect(async () =>
    alpha.clientApplication.waitForReconnectionInstructions.waitFor()
  ).rejects.toThrow();
  // reconnects to lobby server
  await alpha.connect();
  // should connect to game server
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();
  await alpha.clientApplication.transitionToGameServer.waitFor();
  alpha.clientApplication.gameContext.requireGame().requireTimeStarted();
}

// no-show user's pending AuthGlobalGameSession gets cleaned up when game ends gracefully
// after other joiners leave

export async function testLateJoinerToGameAfterOtherPlayersLeft(
  testFixture: IntegrationTestFixture
) {
  // two users in lobby progression game
  // both toggle ready to start
  // one disconnects before getting their connnection instructions
  // other connects to game server
  // connected user leaves game
  //
  // game still exists for user to join late
  // user joins late, game starts for them as only remaining user
}

import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { ClientIntentType, GameStateUpdateType } from "@speed-dungeon/common";

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
  // disconnects after starting game but before getting connection instructions
  await alpha.clientApplication.lobbyClientRef.get().close();
  await expect(async () =>
    alpha.clientApplication.topologyManager.waitForReconnectionInstructions.waitFor()
  ).rejects.toThrow();
  // reconnects to lobby server
  await alpha.connect();
  // should connect to game server
  await alpha.clientApplication.topologyManager.waitForReconnectionInstructions.waitFor();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitFor();
  alpha.clientApplication.gameContext.requireGame().clock.requireLive();
}

export async function testLateJoinerToGameAfterOtherPlayersLeft(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  // two users in lobby progression game
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    undefined,
    undefined
  );
  // both toggle ready to start
  await alpha.lobbyClientHarness.toggleReadyToStartGame();

  bravo.clientApplication.lobbyClientRef.get().dispatchIntent({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });
  // one disconnects after starting game but before getting connection instructinos
  await bravo.clientApplication.lobbyClientRef.get().close();
  await expect(async () =>
    bravo.clientApplication.topologyManager.waitForReconnectionInstructions.waitFor()
  ).rejects.toThrow();

  // other connects to game server
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  // connected user leaves game
  await alpha.gameClientHarness.leaveGame();
  // game still exists for user to join late
  // user joins late, game starts for them as only remaining user
  await bravo.connect();
  // should connect to game server
  await bravo.clientApplication.topologyManager.waitForReconnectionInstructions.waitFor();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitFor();
  bravo.clientApplication.gameContext.requireGame().clock.requireLive();
  expect(bravo.clientApplication.gameContext.requireGame().getPlayerCount()).toBe(1);
}

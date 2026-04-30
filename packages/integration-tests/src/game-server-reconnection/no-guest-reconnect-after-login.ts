import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { GameStateUpdateType } from "@speed-dungeon/common";

export async function testNoGuestReconnectionAfterLogin(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({});

  await alpha.clientApplication.gameClientRef.get().close();
  await bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );
  await alpha.reconnectAsAuth(TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();
  expect(() => alpha.clientApplication.transitionToGameServer.waitFor()).toThrow();
}

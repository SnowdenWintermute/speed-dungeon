import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  GameStateUpdateType,
  RECONNECTION_OPPORTUNITY_TIMEOUT_MS,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testReconnectionAfterTimeout(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({
    auth: options.useAuthenticatedUsers,
  });

  await alpha.clientApplication.gameClientRef.get().close();
  await bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );
  const alphaReconnectionTimedOutPacketReceivedPromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerReconnectionTimedOut
  );

  testFixture.timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

  await alphaReconnectionTimedOutPacketReceivedPromise;

  await alpha.connect();
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();
  expect(alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken).toBeNull();
  expect(alpha.clientApplication.gameClientRef.isInitialized).toBeFalsy();
}

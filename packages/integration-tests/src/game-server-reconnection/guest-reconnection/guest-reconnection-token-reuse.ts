import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  invariant,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testGuestReconnectionTokenReuse(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();
  const tokenToAttemptReuse =
    alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken;

  // now try disconnect/reconnect
  await alpha.clientApplication.gameClientRef.get().close();
  invariant(tokenToAttemptReuse !== null, "expected to have a guestGameReconnectionToken");
  // a reconnect
  await alpha.connect();
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();
  await alpha.clientApplication.transitionToGameServer.waitFor();
  await alpha.clientApplication.gameClientRef.get().close();
  // reconnect with same token
  alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken = tokenToAttemptReuse;
  await alpha.connect();
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();

  expect(alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken).toBeNull();
  expect(alpha.clientApplication.gameClientRef.isInitialized).toBeFalsy();
}

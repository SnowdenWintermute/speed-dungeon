import { TEST_GAME_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "@speed-dungeon/common";

// can make game of previously existing game name if it timed out all reconnection opportunities
export async function testReconnectionTimeoutGameCleanup(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({
    auth: options.useAuthenticatedUsers,
  });
  // disconnect
  await alpha.clientApplication.gameClientRef.get().close();
  await bravo.clientApplication.gameClientRef.get().close();
  // wait for timeout
  testFixture.timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);
  // doesn't get reconnected
  await alpha.connect();
  await alpha.clientApplication.waitForReconnectionInstructions.waitFor();
  expect(() => alpha.clientApplication.transitionToGameServer.waitFor()).toThrow();

  // close() resolves on the client as soon as the close frame is sent, but the server's
  // disconnectionHandler (which schedules the reconnection-opportunity setTimeout) runs
  // later. Alpha's handler ran before the first advanceTime so its timer fired; bravo's
  // was registered afterward at the now-advanced fake-time, so it needs its own full
  // timeout window to expire.
  testFixture.timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

  await bravo.connect();
  await bravo.clientApplication.waitForReconnectionInstructions.waitFor();
  expect(() => bravo.clientApplication.transitionToGameServer.waitFor()).toThrow();
  // can create game of same name
  alpha.clientApplication.errorRecordService.clear();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME);
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
}

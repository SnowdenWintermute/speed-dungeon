import { TEST_GAME_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

// can make game of previously existing game name if it timed out all reconnection opportunities
export async function testReconnectionTimeoutGameCleanup(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();
  // disconnect
  // wait for timeout
  // doesn't get reconnected
  // can create game of same name
}

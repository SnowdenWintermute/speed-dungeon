import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export async function testAbandonLiveIronmanRun(testFixture: IntegrationTestFixture) {
  // two players in an ironman run
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: false });
  // - user bravo sends "abandon ironman run" client intent
  expect(bravo.clientApplication.errorRecordService.count).toBe(0);
  const gameId = bravo.clientApplication.gameContext.requireGame().id;
  await bravo.gameClientHarness.abandonIronmanRun(gameId);
  // - get generic server error because no such handler on the game server
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.SERVER_GENERIC
  );
}

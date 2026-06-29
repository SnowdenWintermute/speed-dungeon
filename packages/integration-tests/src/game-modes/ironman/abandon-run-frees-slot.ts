import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { invariant } from "@speed-dungeon/common";

export async function testAbandonIronmanRunFreesSlot(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // - players leave the game
  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });
  // - bravo's client sees a filled ironman run slot
  const expectedRunId = bravo.clientApplication.lobbyContext.savedIronmanRuns.values().next()
    .value?.gameId;
  expect(expectedRunId).toBeTruthy();
  expect(bravo.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(1);
  invariant(expectedRunId !== undefined);

  // - user bravo sends "abondon ironman run" client intent
  await bravo.lobbyClientHarness.abandonIronmanRun(expectedRunId);
  // - user bravo's client all ironman run slots empty/available
  expect(bravo.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(0);
}

import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { invariant, TEST_DUNGEON_TWO_WOLF_ROOMS } from "@speed-dungeon/common";

export async function testAbandonRunDeletion(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });

  const alphaIronmanRunRef = alpha.clientApplication.lobbyContext.savedIronmanRuns
    .values()
    .next().value;
  invariant(
    alphaIronmanRunRef !== undefined,
    "expected alpha to have a reference to the shared run"
  );

  await alpha.lobbyClientHarness.abandonIronmanRun(alphaIronmanRunRef.gameId);
  expect(alpha.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(0);
  const runExistsAfterAlphaAbandons =
    await testFixture.userGameDataPersistenceService.requireIronmanRun(alphaIronmanRunRef.gameId);
  expect(runExistsAfterAlphaAbandons).toBeTruthy();
  await bravo.lobbyClientHarness.abandonIronmanRun(alphaIronmanRunRef.gameId);

  expect(
    async () =>
      await testFixture.userGameDataPersistenceService.requireIronmanRun(alphaIronmanRunRef.gameId)
  ).rejects.toThrow();
}

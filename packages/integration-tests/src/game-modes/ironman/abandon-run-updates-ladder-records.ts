import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { IdentityProviderId, invariant } from "@speed-dungeon/common";

export async function testAbandoningIronmanRunUpdatesLadderRecords(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });
  const expectedRunId = bravo.clientApplication.lobbyContext.savedIronmanRuns.values().next()
    .value?.gameId;
  expect(expectedRunId).toBeTruthy();
  invariant(expectedRunId !== undefined);

  // ladder record shows player in run
  const gameRecordBeforeAbandoned =
    await testFixture.ladderGameRecordsService.requireGameRecordAggregate(expectedRunId);

  // - user bravo sends "abondon ironman run" client intent
  await bravo.lobbyClientHarness.abandonIronmanRun(expectedRunId);

  // - ironman run ladder record shows their player abandoned the run
  const gameRecordAfterAbandoned =
    await testFixture.ladderGameRecordsService.requireGameRecordAggregate(expectedRunId);
  const gameHistory = await testFixture.ladderGameRecordsService.getUserGameHistory(
    1 as IdentityProviderId,
    0
  );
  //
  console.log("game history:", gameHistory);

  // expect(gameRecordAfterAbandoned.p)
}

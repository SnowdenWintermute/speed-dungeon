import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { MISSING_RECORD_ID } from "@/fixtures/consts";
import {
  CharacterControlScheme,
  GameName,
  LadderPartyFloorClearRecordId,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
  invariant,
} from "@speed-dungeon/common";

// Where a clear stands on the cumulative board, for a page that shows the clear rather than the
// board. Storage counts the clears that beat it instead of building the board and searching it, so
// the claim under test is that the count and the board agree — including the tie-break, which is the
// part the two could most easily disagree about.
export async function testCumulativeClearRankReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const { client: alpha } = await testFixture.createSingleClientInGameServerGame({
    gameName: "rank-run" as GameName,
  });

  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  testFixture.timeMachine.advanceTime(ONE_SECOND * 2);
  await alpha.gameClientHarness.toggleReadyToDescend();

  const ladderQueries = await testFixture.createLadderViewerQueries();
  const board = await ladderQueries.getCumulativeClearTimes({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  expect(board.entries.map((entry) => entry.floor)).toEqual([2, 1]);

  const ranksById = await ladderQueries.getCumulativeClearRanks([
    ...board.entries.map((entry) => entry.id),
    MISSING_RECORD_ID as LadderPartyFloorClearRecordId,
  ]);

  // the rank a clear is told it holds is the rank it holds on the board it was read from
  for (const entry of board.entries) {
    expect(ranksById[entry.id]).toBe(entry.rank);
  }
  const deepest = board.entries[0];
  invariant(deepest !== undefined, "expected the floor 2 clear at the top of the board");
  expect(ranksById[deepest.id]).toBe(1);

  // a clear that is not on the board — here one that never existed — is absent rather than ranked
  expect(ranksById[MISSING_RECORD_ID as LadderPartyFloorClearRecordId]).toBeUndefined();
  expect(await ladderQueries.getCumulativeClearRanks([])).toEqual({});
}

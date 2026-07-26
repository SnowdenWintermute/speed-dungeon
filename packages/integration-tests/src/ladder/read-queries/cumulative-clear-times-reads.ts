import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import {
  CharacterControlScheme,
  GameMode,
  invariant,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// The board behind the "Deepest Cumulative Time To Clear" tab: the same floor clears as
// getFloorClearTimes, but across every floor at once and ordered deepest-first, then fastest to get
// there. Drives a real Ironman run over two descents and reads it back over the socket, so the
// ordering, the cumulative sum and the new clearedAt all come through the whole path.
export async function testCumulativeClearTimesReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const { client: alpha, gameId } = await testFixture.createSingleClientInGameServerGame();

  // distinct time on each floor, so the cumulative sum can't accidentally match either one alone
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  testFixture.timeMachine.advanceTime(ONE_SECOND * 2);
  await alpha.gameClientHarness.toggleReadyToDescend();

  // ground truth from the write path
  const aggregate = await testFixture.ladderGameRecordsService.requireGameRecordAggregate(gameId);
  const partyAggregate = aggregate.parties[0];
  invariant(partyAggregate !== undefined, "expected a recorded party");
  const floorClearsByFloor = new Map(
    partyAggregate.floorClears.map((clear) => [clear.floor, clear])
  );
  const floor1Clear = floorClearsByFloor.get(1);
  const floor2Clear = floorClearsByFloor.get(2);
  invariant(
    floor1Clear !== undefined && floor2Clear !== undefined,
    "expected floor 1 and floor 2 clear records from two descents"
  );

  const ladderQueries = await testFixture.createLadderViewerQueries();

  // an Ironman run is played under the Captain scheme, and each scheme is its own board
  const page = await ladderQueries.getCumulativeClearTimes({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });

  expect(page.entries).toHaveLength(2);
  const [deepest, shallower] = page.entries;
  invariant(deepest !== undefined && shallower !== undefined, "expected both clears on the board");

  // the ordering this query exists for: floor 2 outranks floor 1 even though it took longer
  expect(deepest.floor).toBe(2);
  expect(deepest.rank).toBe(1);
  expect(shallower.floor).toBe(1);
  expect(shallower.rank).toBe(2);

  expect(deepest.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );
  expect(shallower.cumulativeTimeToClearFloor).toBe(floor1Clear.timeSpentOnFloor);

  // the stored wall-clock clear time, which period leaderboards will filter on
  expect(deepest.clearedAt).toBe(floor2Clear.clearedAt);
  expect(shallower.clearedAt).toBe(floor1Clear.clearedAt);
  expect(deepest.clearedAt).toBeGreaterThan(shallower.clearedAt);

  // mode is a column here rather than a filter, since the board spans game modes
  expect(deepest.mode).toBe(GameMode.Ironman);
  expect(deepest.partyRecordId).toBe(partyAggregate.party.id);
  expect(deepest.gameRecordId).toBe(gameId);
  expect(deepest.players).toEqual([TEST_AUTH_USERNAME_PLAYER_1]);

  // the other scheme is a different board, not a filter over a shared one
  const freelancerPage = await ladderQueries.getCumulativeClearTimes({
    controlScheme: CharacterControlScheme.Freelancer,
    page: 0,
  });
  expect(freelancerPage.entries).toHaveLength(0);
}

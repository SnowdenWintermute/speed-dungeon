import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  GameId,
  GameMode,
  GameName,
  invariant,
  Milliseconds,
  ONE_SECOND,
  PlayerProfileLookupType,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requireGameRecordAggregate } from "./aggregate-lookup";

// A profile keeps two personal-best lists because the two clocks disagree: how fast a player took a
// floor is not how fast they arrived at it. Two Ironman runs are arranged so the same floor is held
// by a different run on each list — one run sprints floor 2, the other gets there sooner because its
// floor 1 was quick. If both lists were selected by one clock, one of these assertions would fail.
export async function testPersonalBestsUseTwoClocks(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();

  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // leaving saves the run and returns to the lobby, which is what lets one player play both
  async function playTwoFloors(
    gameName: string,
    characterName: string,
    floorOneTime: Milliseconds,
    floorTwoTime: Milliseconds
  ): Promise<GameId> {
    const gameId = await testFixture.driveClientIntoSinglePartyGameServerGame(alpha, {
      mode: GameMode.Ironman,
      gameName: gameName as GameName,
      characterName,
      combatantClass: CombatantClass.Warrior,
    });
    testFixture.timeMachine.advanceTime(floorOneTime);
    await alpha.gameClientHarness.toggleReadyToDescend();
    testFixture.timeMachine.advanceTime(floorTwoTime);
    await alpha.gameClientHarness.toggleReadyToDescend();
    await alpha.clientApplication.gameClientRef.get().leaveGame();
    await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
    return gameId;
  }

  // a slow descent to a fast floor 2: this run should hold the best time ON floor 2
  const sprintGameId = await playTwoFloors("sprint-run", "char-sprint", ONE_SECOND * 4, ONE_SECOND);
  // a fast descent to a slower floor 2: this run should hold the best cumulative time TO floor 2
  const descentGameId = await playTwoFloors(
    "descent-run",
    "char-descent",
    ONE_SECOND,
    ONE_SECOND * 2
  );

  // ground truth from the write path, so the assertions do not depend on exact tick timing
  const sprintTimes = await floorTimesOf(testFixture, sprintGameId);
  const descentTimes = await floorTimesOf(testFixture, descentGameId);
  // the arrangement itself has to hold, or the two lists agreeing would prove nothing
  expect(sprintTimes.floorTwo).toBeLessThan(descentTimes.floorTwo);
  expect(descentTimes.cumulativeToFloorTwo).toBeLessThan(sprintTimes.cumulativeToFloorTwo);

  const lookup = await alpha.clientApplication.ladderQueries.getPlayerProfile(
    TEST_AUTH_USERNAME_PLAYER_1
  );
  invariant(lookup.type === PlayerProfileLookupType.Found, "expected to find the participant");

  const bestFloorTime = requireOnlyFloorTwoEntry(lookup.profile.personalBestFloorTimes);
  const bestCumulativeTime = requireOnlyFloorTwoEntry(lookup.profile.personalBestCumulativeTimes);

  expect(bestFloorTime.gameRecordId).toBe(sprintGameId);
  expect(bestFloorTime.timeSpentOnFloor).toBe(sprintTimes.floorTwo);
  expect(bestCumulativeTime.gameRecordId).toBe(descentGameId);
  expect(bestCumulativeTime.cumulativeTimeToClearFloor).toBe(descentTimes.cumulativeToFloorTwo);
  expect(bestCumulativeTime.id).not.toBe(bestFloorTime.id);
}

function requireOnlyFloorTwoEntry<TEntry extends { floor: number }>(entries: TEntry[]): TEntry {
  const floorTwoEntries = entries.filter((entry) => entry.floor === 2);
  expect(floorTwoEntries).toHaveLength(1);
  const entry = floorTwoEntries[0];
  invariant(entry !== undefined, "expected exactly one floor-2 personal best");
  return entry;
}

async function floorTimesOf(testFixture: IntegrationTestFixture, gameId: GameId) {
  const aggregate = await requireGameRecordAggregate(testFixture, gameId);
  const party = aggregate.parties[0];
  invariant(party !== undefined, "expected a recorded party");
  const floorOne = party.floorClears.find((clear) => clear.floor === 1);
  const floorTwo = party.floorClears.find((clear) => clear.floor === 2);
  invariant(
    floorOne !== undefined && floorTwo !== undefined,
    "expected floor 1 and floor 2 clear records from two descents"
  );
  return {
    floorTwo: floorTwo.timeSpentOnFloor,
    cumulativeToFloorTwo: floorOne.timeSpentOnFloor + floorTwo.timeSpentOnFloor,
  };
}

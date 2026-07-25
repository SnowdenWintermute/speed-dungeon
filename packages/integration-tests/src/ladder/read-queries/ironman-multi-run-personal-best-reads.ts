import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  GameMode,
  GameName,
  invariant,
  LadderGameRecordAggregate,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requireOwnerId, requirePartyOfCharacter } from "./aggregate-lookup";

// One player plays two Ironman runs and clears floor 1 in each, spending a different amount of active
// time. getPlayerProfileData's personal-best projection dedupes by (floor, mode, controlScheme) and
// keeps the fastest — so the profile should show exactly one floor-1 best, at the smaller of the two
// times. This is the only projection logic (cross-run min) not already covered by a played run.
export async function testIronmanMultiRunPersonalBest(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();

  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // run 1: a slower floor-1 clear. leaving saves the run (1 of 2 slots) and returns to the lobby.
  const gameId1 = await testFixture.driveClientIntoSinglePartyGameServerGame(alpha, {
    mode: GameMode.Ironman,
    gameName: "run-1" as GameName,
    characterName: "char-1",
    combatantClass: CombatantClass.Warrior,
  });
  testFixture.timeMachine.advanceTime(ONE_SECOND * 3);
  await alpha.gameClientHarness.toggleReadyToDescend();
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // run 2: a faster floor-1 clear.
  const gameId2 = await testFixture.driveClientIntoSinglePartyGameServerGame(alpha, {
    mode: GameMode.Ironman,
    gameName: "run-2" as GameName,
    characterName: "char-2",
    combatantClass: CombatantClass.Warrior,
  });
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  const service = testFixture.ladderGameRecordsService;

  // ground truth: each run's recorded floor-1 time (robust to exact tick timing)
  const aggregate1 = await service.requireGameRecordAggregate(gameId1);
  const aggregate2 = await service.requireGameRecordAggregate(gameId2);
  const time1 = requireFloorOneTime(aggregate1);
  const time2 = requireFloorOneTime(aggregate2);
  // the two runs must differ, otherwise "keeps the faster" isn't actually exercised
  expect(time1).not.toBe(time2);
  const ownerId = requireOwnerId(requirePartyOfCharacter(aggregate1, "char-1"), "char-1");

  // both runs' floor-1 clears belong to the same player, so the personal-best dedupes to one entry
  const profile = await service.getPlayerProfileData(ownerId);
  invariant(profile !== undefined, "expected a profile for the participant");
  const floorOneBests = profile.personalBestFloorClears.filter((entry) => entry.floor === 1);
  expect(floorOneBests).toHaveLength(1);
  const best = floorOneBests[0];
  invariant(best !== undefined, "expected a floor-1 personal best");
  expect(best.timeSpentOnFloor).toBe(Math.min(time1, time2));
}

function requireFloorOneTime(aggregate: LadderGameRecordAggregate): number {
  const party = aggregate.parties[0];
  invariant(party !== undefined, "expected a recorded party");
  const floorOneClear = party.floorClears.find((clear) => clear.floor === 1);
  invariant(floorOneClear !== undefined, "expected a floor-1 clear record");
  return floorOneClear.timeSpentOnFloor;
}

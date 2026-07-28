import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import {
  GameMode,
  invariant,
  ONE_SECOND,
  PlayerProfileLookupType,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// Drives a real Ironman run through two floor descents, then reads it back the way a player does: a
// client sitting in the lobby runs the LadderQueries over the socket, so this covers the whole path
// (query intent -> lobby handler -> projection -> username resolution -> reply to the caller).
// Expected values are derived from getGameRecordAggregate (ground truth), so this stays robust to
// exact tick timing while still exercising the projection logic: sort/rank, cumulative sum, player
// attribution, and snapshot-id linkage. Its ranked-race counterpart is ranked-race-win-rate-reads.ts.
export async function testIronmanFloorClearReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const {
    client: alpha,
    gameId,
    characterName,
  } = await testFixture.createSingleClientInGameServerGame();

  // clear floor 1, then floor 2, spending a distinct amount of active time on each
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  testFixture.timeMachine.advanceTime(ONE_SECOND * 2);
  await alpha.gameClientHarness.toggleReadyToDescend();
  expect(
    alpha.clientApplication.gameContext
      .requireGame()
      .requireSingleParty()
      .dungeonExplorationManager.getCurrentFloor()
  ).toBe(3);

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
  const recordedCharacter = partyAggregate.characters[0];
  invariant(recordedCharacter !== undefined, "expected a recorded character");

  // the reads under test are a client's, made from the lobby by someone who wasn't in the run
  const ladderQueries = await testFixture.createLadderViewerQueries();

  // --- getFloorClearTimes(floor 1) ---
  const floor1Page = await ladderQueries.getFloorClearTimes({
    floor: 1,
    page: 0,
  });
  expect(floor1Page.entries).toHaveLength(1);
  const floor1Entry = floor1Page.entries[0];
  invariant(floor1Entry !== undefined, "expected a floor 1 entry");
  expect(floor1Entry.rank).toBe(1);
  expect(floor1Entry.floor).toBe(1);
  expect(floor1Entry.mode).toBe(GameMode.Ironman);
  expect(floor1Entry.gameRecordId).toBe(gameId);
  expect(floor1Entry.partyRecordId).toBe(partyAggregate.party.id);
  expect(floor1Entry.gameStartedAt).toBe(aggregate.game.timeStarted);
  expect(floor1Entry.timeSpentOnFloor).toBe(floor1Clear.timeSpentOnFloor);
  // only floor 1 has elapsed so far → cumulative == floor 1 time
  expect(floor1Entry.cumulativeTimeToClearFloor).toBe(floor1Clear.timeSpentOnFloor);
  // the client sees usernames; the id it was recorded under never leaves the server
  expect(floor1Entry.players).toEqual([TEST_AUTH_USERNAME_PLAYER_1]);

  // the character's snapshot-id links back to the snapshot recorded for that floor clear
  const floor1Snapshot = recordedCharacter.floorClearedSnapshots.find(
    (snap) => snap.partyFloorClearRecord === floor1Clear.id
  );
  invariant(floor1Snapshot !== undefined, "expected a character snapshot for the floor 1 clear");
  const floor1EntryCharacter = floor1Entry.characters.find(
    (character) => character.characterId === recordedCharacter.character.id
  );
  invariant(floor1EntryCharacter !== undefined, "expected the character in the floor 1 entry");
  expect(floor1EntryCharacter.characterName).toBe(characterName);
  expect(floor1EntryCharacter.snapshotIdOption).toBe(floor1Snapshot.id);

  // --- getFloorClearTimes(floor 2): cumulative sums floors 1 + 2 ---
  const floor2Page = await ladderQueries.getFloorClearTimes({
    floor: 2,
    page: 0,
  });
  expect(floor2Page.entries).toHaveLength(1);
  const floor2Entry = floor2Page.entries[0];
  invariant(floor2Entry !== undefined, "expected a floor 2 entry");
  expect(floor2Entry.timeSpentOnFloor).toBe(floor2Clear.timeSpentOnFloor);
  expect(floor2Entry.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );

  // --- player profile: personal bests cover both floors; ironman is not ranked race ---
  const lookup = await ladderQueries.getPlayerProfile(TEST_AUTH_USERNAME_PLAYER_1);
  invariant(lookup.type === PlayerProfileLookupType.Found, "expected to find the player");
  const { profile } = lookup;
  expect(profile.username).toBe(TEST_AUTH_USERNAME_PLAYER_1);
  expect(profile.rankedRaceRecord).toEqual({
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    winRate: 0,
  });
  // one run, so both lists hold the same two clears — which run is best by either clock is only a
  // question once there are two
  expect(profile.personalBestFloorTimes.map((entry) => entry.floor)).toEqual([1, 2]);
  expect(profile.personalBestCumulativeTimes.map((entry) => entry.floor)).toEqual([1, 2]);
  const profileFloor2 = profile.personalBestFloorTimes.find((entry) => entry.floor === 2);
  expect(profileFloor2?.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );
}

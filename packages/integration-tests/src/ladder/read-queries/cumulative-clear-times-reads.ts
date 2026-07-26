import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import {
  CharacterControlScheme,
  GameMode,
  GameName,
  invariant,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requirePartyOfCharacter } from "./aggregate-lookup";

// The board behind the "Deepest Cumulative Time To Clear" tab: the same floor clears as
// getFloorClearTimes, but across every floor at once and ordered deepest-first, then fastest to get
// there. Drives a real Ironman run over two descents and reads it back over the socket, so the
// ordering, the cumulative sum and the new clearedAt all come through the whole path.
export async function testCumulativeClearTimesReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const { client: alpha, gameId } = await testFixture.createSingleClientInGameServerGame({
    gameName: "ironman-run" as GameName,
  });

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

  // the race helper authenticates as the same player, so this run has to be left before it starts
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // a second game, in the other mode that records clears. the board is supposed to span modes —
  // ironman and race play by the same rules — so this race's floor 1 belongs on the same board as
  // the ironman clears above. both games default to the Captain scheme, so it is one board.
  const { alpha: racer, alphaCharacterName: racerCharacterName } =
    await testFixture.createTwoClientsInGameServerGame({
      auth: true,
      mode: GameMode.RankedRace,
      separateParties: true,
    });
  const raceGameId = racer.clientApplication.gameContext.requireGame().id;

  // longer than the ironman floor 1, so the two floor-1 rows have a deterministic relative order
  testFixture.timeMachine.advanceTime(ONE_SECOND * 3);
  await racer.gameClientHarness.toggleReadyToDescend();

  const raceAggregate =
    await testFixture.ladderGameRecordsService.requireGameRecordAggregate(raceGameId);
  expect(raceAggregate.game.mode).toBe(GameMode.RankedRace);
  const racerParty = requirePartyOfCharacter(raceAggregate, racerCharacterName);
  const raceFloor1Clear = racerParty.floorClears.find((clear) => clear.floor === 1);
  invariant(raceFloor1Clear !== undefined, "expected the race party to have cleared floor 1");

  const ladderQueries = await testFixture.createLadderViewerQueries();

  // an Ironman run is played under the Captain scheme, and each scheme is its own board
  const page = await ladderQueries.getCumulativeClearTimes({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });

  expect(page.entries).toHaveLength(3);
  const [deepest, ironmanFloor1, raceFloor1] = page.entries;
  invariant(
    deepest !== undefined && ironmanFloor1 !== undefined && raceFloor1 !== undefined,
    "expected the ironman run's two clears and the race's one"
  );

  // the ordering this query exists for: floor 2 outranks both floor 1s even though it took longer
  expect(deepest.floor).toBe(2);
  expect(deepest.rank).toBe(1);
  expect(deepest.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );

  // then the floor 1s among themselves, fastest cumulative first
  expect(ironmanFloor1.floor).toBe(1);
  expect(ironmanFloor1.rank).toBe(2);
  expect(ironmanFloor1.cumulativeTimeToClearFloor).toBe(floor1Clear.timeSpentOnFloor);
  expect(raceFloor1.floor).toBe(1);
  expect(raceFloor1.rank).toBe(3);
  expect(raceFloor1.cumulativeTimeToClearFloor).toBe(raceFloor1Clear.timeSpentOnFloor);
  expect(ironmanFloor1.cumulativeTimeToClearFloor).toBeLessThan(
    raceFloor1.cumulativeTimeToClearFloor
  );

  // the whole point of one board across modes: an ironman clear and a race clear rank against each
  // other, with mode as a column rather than a filter
  expect(deepest.mode).toBe(GameMode.Ironman);
  expect(ironmanFloor1.mode).toBe(GameMode.Ironman);
  expect(raceFloor1.mode).toBe(GameMode.RankedRace);
  expect(raceFloor1.gameRecordId).toBe(raceGameId);

  // the stored wall-clock clear time, which period leaderboards will filter on
  expect(deepest.clearedAt).toBe(floor2Clear.clearedAt);
  expect(ironmanFloor1.clearedAt).toBe(floor1Clear.clearedAt);
  expect(deepest.clearedAt).toBeGreaterThan(ironmanFloor1.clearedAt);

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

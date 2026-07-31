import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  createFloorClearedMessage,
  createFloorClearTimeRecordMessage,
  describeFloorClearBoard,
  FloorClearSortField,
  GameMode,
  GameName,
  invariant,
  LadderGameRecordAggregate,
  LadderPartyFloorClearRecordId,
  ONE_SECOND,
  RankedFloorClearView,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requireGameRecordAggregate } from "./aggregate-lookup";

// The announcement a party gets for placing on a floor clear board states a rank, and that rank is
// counted ("clears that beat this one, plus one") rather than read off the board. The board itself
// ranks by position in a sorted page. Those are two different pieces of code answering one question,
// so the claim under test is that a party is never told a rank that disagrees with what a reader
// would see on the board — including the tie-break, and including the rank 1 wording, which is its
// own branch. Two runs, because with one clear every rank is 1 and the test proves nothing.
export async function testFloorClearRecordAnnouncements(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();

  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // run 1: the faster floor-1 clear, so it takes the record and run 2 has something to place behind
  const fastGameId = await testFixture.driveClientIntoSinglePartyGameServerGame(alpha, {
    mode: GameMode.Ironman,
    gameName: "record-run" as GameName,
    characterName: "char-1",
    combatantClass: CombatantClass.Warrior,
  });
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  // captured before leaving: the log belongs to the client's game session, not to the assertions
  const fastRunMessages = alpha.getEventLogMessageTexts();
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // run 2: slower on the same floor, so it places second rather than setting a record
  const slowGameId = await testFixture.driveClientIntoSinglePartyGameServerGame(alpha, {
    mode: GameMode.Ironman,
    gameName: "runner-up-run" as GameName,
    characterName: "char-2",
    combatantClass: CombatantClass.Warrior,
  });
  testFixture.timeMachine.advanceTime(ONE_SECOND * 3);
  await alpha.gameClientHarness.toggleReadyToDescend();
  const slowRunMessages = alpha.getEventLogMessageTexts();
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  const fastClearId = requireFloorOneClearId(await requireGameRecordAggregate(testFixture, fastGameId));
  const slowClearId = requireFloorOneClearId(await requireGameRecordAggregate(testFixture, slowGameId));

  // the board as a reader sees it, which is what the announced ranks have to agree with
  const board = await alpha.clientApplication.ladderQueries.getFloorClearTimes({
    floor: 1,
    page: 0,
  });
  const fastEntry = requireEntry(board.entries, fastClearId);
  const slowEntry = requireEntry(board.entries, slowClearId);

  // the ordering the rest of this rests on: without it a passing test would only mean both sides
  // agree on rank 1, which they would even if the counting were wrong
  expect(fastEntry.rank).toBe(1);
  expect(slowEntry.rank).toBe(2);

  // rank 1 is its own wording — "a new record for", not "the 1st fastest"
  expectAnnouncedRankMatchesBoard(fastRunMessages, fastEntry);
  expectAnnouncedRankMatchesBoard(slowRunMessages, slowEntry);

  // the party's own message carries the two times and no rank at all: a party learns it placed only
  // from the announcements above
  expect(slowRunMessages).toContain(
    createFloorClearedMessage(1, slowEntry.timeSpentOnFloor, slowEntry.cumulativeTimeToClearFloor)
  );
  expect(slowRunMessages.some((text) => text?.includes("fastest"))).toBe(true);
}

// both boards for the floor, since a clear places on each independently and each names itself in the
// message. on floor 1 the two clocks read the same, so what this pins down is the wording and the
// rank rather than the two times diverging
function expectAnnouncedRankMatchesBoard(messageTexts: string[], entry: RankedFloorClearView) {
  expect(messageTexts).toContain(
    createFloorClearTimeRecordMessage(
      entry.partyName,
      entry.rank,
      describeFloorClearBoard(entry.controlScheme, FloorClearSortField.TimeSpentOnFloor, entry.floor),
      entry.timeSpentOnFloor
    )
  );
  expect(messageTexts).toContain(
    createFloorClearTimeRecordMessage(
      entry.partyName,
      entry.rank,
      describeFloorClearBoard(
        entry.controlScheme,
        FloorClearSortField.CumulativeTimeToClearFloor,
        entry.floor
      ),
      entry.cumulativeTimeToClearFloor
    )
  );
}

function requireEntry(entries: RankedFloorClearView[], id: LadderPartyFloorClearRecordId) {
  const entryOption = entries.find((entry) => entry.id === id);
  invariant(entryOption !== undefined, `expected the clear ${id} on the floor 1 board`);
  return entryOption;
}

function requireFloorOneClearId(aggregate: LadderGameRecordAggregate): LadderPartyFloorClearRecordId {
  const party = aggregate.parties[0];
  invariant(party !== undefined, "expected a recorded party");
  const floorOneClear = party.floorClears.find((clear) => clear.floor === 1);
  invariant(floorOneClear !== undefined, "expected a floor-1 clear record");
  return floorOneClear.id;
}

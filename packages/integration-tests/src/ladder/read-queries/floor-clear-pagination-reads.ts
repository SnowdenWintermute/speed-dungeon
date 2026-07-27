import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_SESSION_ID_PLAYER_3,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ERROR_MESSAGES,
  GameMode,
  GameName,
  LADDER_MAX_PAGE_SIZE,
  LADDER_MAX_RANKED_ENTRIES,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// Pagination, for every board that has it: the page size travels on the query, so this exercises the
// one path they all share rather than repeating itself per facet. Three independent Ironman runs (one
// per user, so no shared saved-run slot and no session collision) each clear floor 1, and a page size
// of two puts a boundary in the middle of them. Asserts the full first page, the partial last page,
// rank continuation across the boundary, totalPages, an out-of-range page, and the two limits on what
// a caller may ask for: a size above the maximum, and a page past the last ranked entry.
export async function testFloorClearPagination(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();

  const authIds = [
    TEST_AUTH_SESSION_ID_PLAYER_1,
    TEST_AUTH_SESSION_ID_PLAYER_2,
    TEST_AUTH_SESSION_ID_PLAYER_3,
  ];
  for (let i = 0; i < authIds.length; i += 1) {
    const { client } = await testFixture.createSingleClientInGameServerGame({
      authId: authIds[i],
      gameName: `pagination-game-${i}` as GameName,
      clientId: `client-${i}`,
      characterName: `char-${i}`,
    });
    testFixture.timeMachine.advanceTime(ONE_SECOND * (i + 1));
    await client.gameClientHarness.toggleReadyToDescend();
  }

  // all three auth identities are playing, so the ladder reader here is a guest in the lobby
  const ladderQueries = await testFixture.createLadderViewerQueries();
  // three floor-1 clears over a page size of two → a full page then a partial page
  const pageSizeOption = 2;
  const page0 = await ladderQueries.getFloorClearTimes({ floor: 1, page: 0, pageSizeOption });
  expect(page0.totalPages).toBe(2);
  expect(page0.entries).toHaveLength(2);
  expect(page0.entries.map((entry) => entry.rank)).toEqual([1, 2]);

  const page1 = await ladderQueries.getFloorClearTimes({ floor: 1, page: 1, pageSizeOption });
  expect(page1.totalPages).toBe(2);
  expect(page1.entries).toHaveLength(1);
  // rank counts from the start of the board, not of the page
  expect(page1.entries.map((entry) => entry.rank)).toEqual([3]);

  // an out-of-range page is empty (still reports the true total)
  const page2 = await ladderQueries.getFloorClearTimes({ floor: 1, page: 2, pageSizeOption });
  expect(page2.totalPages).toBe(2);
  expect(page2.entries).toHaveLength(0);

  // fastest-first ordering holds across the page boundary
  const allEntries = [...page0.entries, ...page1.entries];
  const times = allEntries.map((entry) => entry.timeSpentOnFloor);
  expect([...times].sort((a, b) => a - b)).toEqual(times);
  // every entry is the floor/mode we recorded
  expect(allEntries.every((entry) => entry.floor === 1 && entry.mode === GameMode.Ironman)).toBe(
    true
  );

  // the size is how many rows a caller we do not control can make the server read, so the maximum is
  // enforced server-side and reaches the client as a rejection
  await expect(
    ladderQueries.getFloorClearTimes({
      floor: 1,
      page: 0,
      pageSizeOption: LADDER_MAX_PAGE_SIZE + 1,
    })
  ).rejects.toThrow(ERROR_MESSAGES.LADDER.INVALID_PAGE_SIZE(LADDER_MAX_PAGE_SIZE));

  // and depth is bounded the same way: OFFSET is paid on the way to finding nothing, so a page past
  // the last ranked entry is refused before any query runs rather than answered with an empty page
  const firstUnrankedPage = LADDER_MAX_RANKED_ENTRIES / pageSizeOption;
  await expect(
    ladderQueries.getFloorClearTimes({ floor: 1, page: firstUnrankedPage, pageSizeOption })
  ).rejects.toThrow(ERROR_MESSAGES.LADDER.PAGE_BEYOND_RANKED_ENTRIES(LADDER_MAX_RANKED_ENTRIES));

  // the page just inside the cap is served, empty like any other page past the last record
  const lastRankedPage = await ladderQueries.getFloorClearTimes({
    floor: 1,
    page: firstUnrankedPage - 1,
    pageSizeOption,
  });
  expect(lastRankedPage.entries).toHaveLength(0);
}

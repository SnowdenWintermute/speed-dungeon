import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_SESSION_ID_PLAYER_3,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  GameMode,
  GameName,
  LADDER_CONFIG,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// Pagination of getFloorClearTimes. Producing >page-size real records is only cheap because the page
// size is a mutable test seam (LADDER_CONFIG.PAGE_SIZE) we shrink to 2 — then three independent
// Ironman runs (one per user, so no shared saved-run slot and no session collision), each clearing
// floor 1, give the four-ish records needed to cross a page boundary. Asserts the full first page, the
// partial last page, rank continuation across the boundary, totalPages, and an out-of-range page.
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

  const service = testFixture.ladderGameRecordsService;
  const originalPageSize = LADDER_CONFIG.PAGE_SIZE;
  LADDER_CONFIG.PAGE_SIZE = 2;
  try {
    // three floor-1 clears over a page size of two → a full page then a partial page
    const page0 = await service.getFloorClearTimes({ floor: 1, page: 0 });
    expect(page0.totalPages).toBe(2);
    expect(page0.entries).toHaveLength(2);
    expect(page0.entries.map((entry) => entry.rank)).toEqual([1, 2]);

    const page1 = await service.getFloorClearTimes({ floor: 1, page: 1 });
    expect(page1.totalPages).toBe(2);
    expect(page1.entries).toHaveLength(1);
    expect(page1.entries.map((entry) => entry.rank)).toEqual([3]);

    // an out-of-range page is empty (still reports the true total)
    const page2 = await service.getFloorClearTimes({ floor: 1, page: 2 });
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
  } finally {
    LADDER_CONFIG.PAGE_SIZE = originalPageSize;
  }
}

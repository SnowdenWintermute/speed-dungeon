import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { vi } from "vitest";

const READ_FAILURE_MESSAGE = "the ladder read blew up";

// A query that errors server-side must settle its caller's promise, carrying the server's own
// message rather than a generic failure — that only works because the error reply is matched back to
// the intent that caused it. The follow-up query then proves the failure left no stale pending entry
// for a later reply to be misattributed to, which is the failure mode ordering alone cannot avoid.
export async function testServerErrorRejectsQuery(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const ladderQueries = await testFixture.createLadderViewerQueries();

  // which read fails is irrelevant; any server-side throw travels the same reply path
  const failingRead = vi
    .spyOn(testFixture.ladderRecordsPersistenceStrategy, "getFloorClearTimes")
    .mockRejectedValue(new Error(READ_FAILURE_MESSAGE));

  await expect(ladderQueries.getFloorClearTimes({ floor: 1, page: 0 })).rejects.toThrow(
    READ_FAILURE_MESSAGE
  );

  failingRead.mockRestore();

  const pageAfterFailure = await ladderQueries.getFloorClearTimes({ floor: 1, page: 0 });
  expect(pageAfterFailure.entries).toEqual([]);
}

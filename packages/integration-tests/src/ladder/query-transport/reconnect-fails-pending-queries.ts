import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

// A reconnect restarts the intent sequence, so a query still waiting on an id from the old
// connection can never be answered and that id will be reused by a fresh intent. It has to be failed
// at the reconnect rather than left to hang or, worse, resolved by an unrelated later reply.
export async function testReconnectFailsPendingQueries(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const viewer = testFixture.createClient("ladder viewer", "");
  await viewer.connect();

  // the server answers, but the reply never reaches the client, so the query is still pending
  viewer.lobbyClientHarness.pauseTransport();
  const pendingQuery = viewer.clientApplication.ladderQueries.getFloorClearTimes({
    floor: 1,
    page: 0,
  });
  const rejection = expect(pendingQuery).rejects.toThrow(ERROR_MESSAGES.SERVER_GENERIC);

  await viewer.reconnectAsAuth("");

  await rejection;
}

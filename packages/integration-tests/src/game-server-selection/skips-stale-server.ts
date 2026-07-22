import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_GAME_NAME,
  TestGameServerName,
} from "@/fixtures/consts";
import { GAME_SERVER_HEARTBEAT_MS } from "@speed-dungeon/common";

export async function testSkipsStaleServer(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(undefined, undefined, undefined, undefined, {
    useFakeTimersFromBoot: true,
  });
  testFixture.useRealLeastBusyGameServerSelector();

  // Lindblum would win on game count, so it can only lose by being stale.
  // isStale() compares against two heartbeats, so advance past that rather than exactly to it
  testFixture.getGameServer(TestGameServerName.Lindblum).stopHeartbeats();
  testFixture.timeMachine.advanceTime(GAME_SERVER_HEARTBEAT_MS * 3);

  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { gameName: TEST_GAME_NAME, proceedToGameServer: true }
  );
  expect(alpha.clientApplication.topologyManager.gameServerUrlOption).toBe(
    localServerUrl(testFixture.getGameServerPort(TestGameServerName.Alexandria))
  );
}

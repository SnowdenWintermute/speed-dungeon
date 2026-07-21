import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_GAME_SERVER_NAME_STRINGS, TestGameServerName } from "@/fixtures/consts";
import {
  GAME_SERVER_HEARTBEAT_MS,
  LOBBY_DANGLING_RESOURCES_CLEANUP_MS,
} from "@speed-dungeon/common";

export async function testStaleGameServerPruning(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(undefined, undefined, undefined, undefined, {
    useFakeTimersFromBoot: true,
  });

  const { gameServerRegistry } = testFixture;
  const lindblumName = TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Lindblum];
  const alexandriaName = TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Alexandria];

  const liveNames = (await gameServerRegistry.getLiveServers()).map((status) => status.name);
  expect(liveNames.sort()).toEqual([lindblumName, alexandriaName].sort());

  testFixture.getGameServer(TestGameServerName.Lindblum).stopHeartbeats();

  testFixture.timeMachine.advanceTime(
    GAME_SERVER_HEARTBEAT_MS * 2 + LOBBY_DANGLING_RESOURCES_CLEANUP_MS
  );

  await vi.waitFor(
    async () => {
      expect(await gameServerRegistry.getServerByName(lindblumName)).toBeNull();
    },
    { timeout: 500, interval: 20 }
  );

  // Alexandria kept heartbeating, so the same sweep left it alone
  const remaining = await gameServerRegistry.getAllServers();
  expect(remaining.map((status) => status.name)).toEqual([alexandriaName]);
}

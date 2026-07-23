import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_GAME_NAME,
  TEST_GAME_SERVER_NAME_STRINGS,
  TestGameServerName,
} from "@/fixtures/consts";
import { ERROR_MESSAGES, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export async function testNoLiveGameServers(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.useRealLeastBusyGameServerSelector();

  for (const [testGameServerName, gameServer] of iterateNumericEnumKeyedRecord(
    testFixture.gameServers
  )) {
    gameServer.stopHeartbeats();
    await testFixture.gameServerRegistry.unregister(
      TEST_GAME_SERVER_NAME_STRINGS[testGameServerName]
    );
  }

  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { gameName: TEST_GAME_NAME }
  );
  await alpha.lobbyClientHarness.toggleReadyToStartGame();

  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.SERVERS.NO_LIVE_GAME_SERVERS
  );
  expect(alpha.clientApplication.topologyManager.gameServerUrlOption).toBeNull();
}

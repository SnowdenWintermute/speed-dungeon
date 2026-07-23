import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_SESSION_ID_PLAYER_3,
  TEST_GAME_NAME,
  TEST_GAME_NAME_2,
  TEST_GAME_NAME_3,
  TestGameServerName,
} from "@/fixtures/consts";

export async function testSendsNewGameToLeastBusyServer(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.useRealLeastBusyGameServerSelector();

  const lindblumUrl = localServerUrl(testFixture.getGameServerPort(TestGameServerName.Lindblum));
  const alexandriaUrl = localServerUrl(
    testFixture.getGameServerPort(TestGameServerName.Alexandria)
  );

  // both servers are empty, so the first candidate wins
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { gameName: TEST_GAME_NAME, proceedToGameServer: true }
  );
  expect(alpha.clientApplication.topologyManager.gameServerUrlOption).toBe(lindblumUrl);

  // alpha's game is now active on Lindblum, so the next game goes elsewhere
  const bravo = await testFixture.createSingleClientInProgressionGame(
    "bravo",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    { gameName: TEST_GAME_NAME_2, proceedToGameServer: true }
  );
  expect(bravo.clientApplication.topologyManager.gameServerUrlOption).toBe(alexandriaUrl);

  // one game each, so selection is by count and not by alternating
  const charlie = await testFixture.createSingleClientInProgressionGame(
    "charlie",
    TEST_AUTH_SESSION_ID_PLAYER_3,
    { gameName: TEST_GAME_NAME_3, proceedToGameServer: true }
  );
  expect(charlie.clientApplication.topologyManager.gameServerUrlOption).toBe(lindblumUrl);
}

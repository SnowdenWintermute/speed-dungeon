import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
  TEST_GAME_NAME_2,
  TEST_GAME_SERVER_NAME_STRINGS,
  TestGameServerName,
} from "@/fixtures/consts";
import { ClientIntentType } from "@speed-dungeon/common";

/** a handed off game is not registered on its game server until the first player connects,
 * so a server holding only pending setups must still count as busy */
export async function testCountsPendingSetups(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  testFixture.useRealLeastBusyGameServerSelector();

  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { gameName: TEST_GAME_NAME }
  );

  // alpha never receives the connection instructions, so it never connects to its game server
  // and the pending setup is never converted into an active game record
  alpha.lobbyClientHarness.pauseTransport();
  alpha.lobbyClientHarness.dispatchWithoutAwaitingReply({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });

  await vi.waitFor(async () => {
    const pendingSetups = await testFixture.gameSessionStoreService.getPendingGameSetups();
    expect(pendingSetups.map((setup) => setup.hostingServerName)).toEqual([
      TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Lindblum],
    ]);
  });

  expect(await testFixture.gameSessionStoreService.getActiveGames()).toEqual([]);

  const bravo = await testFixture.createSingleClientInProgressionGame(
    "bravo",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    { gameName: TEST_GAME_NAME_2, proceedToGameServer: true }
  );
  expect(bravo.clientApplication.topologyManager.gameServerUrlOption).toBe(
    localServerUrl(testFixture.getGameServerPort(TestGameServerName.Alexandria))
  );
}

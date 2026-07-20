import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { GameStateUpdateType } from "@speed-dungeon/common";

export async function testPlayerLeavingClosesIronmanGame(testFixture: IntegrationTestFixture) {
  // two players in an ironman run
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: false });
  // one player leaves
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  // other player gets "player left run" message
  const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // other player's client disconnects from game server
  await bravoDisconnectedOnAlphaLeavePromise;
  // other player's client connects to lobby server
  await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
}

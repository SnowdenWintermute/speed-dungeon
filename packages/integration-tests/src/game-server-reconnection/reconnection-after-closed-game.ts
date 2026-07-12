import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { GameStateUpdateType } from "@speed-dungeon/common";

export async function testReconnectToClosedIronmanGame(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const [alpha, bravo] = await testFixture.createConnectedClients([
    { id: "alpha", authSessionId: TEST_AUTH_SESSION_ID_PLAYER_1 },
    { id: "bravo", authSessionId: TEST_AUTH_SESSION_ID_PLAYER_2 },
  ]);

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: false });

  //  player disconnects from ironman run
  await bravo.clientApplication.gameClientRef.get().close();
  await alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );
  //  other player in run intentionally leaves
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  await alpha.lobbyClientHarness.fetchGameList();
  //  live game no longer exists
  expect(alpha.clientApplication.lobbyContext.gameList.length).toBe(0);

  //  disconnected player connects to lobby
  await bravo.connect();
  //  no reconnection instructions received by player's client
  await bravo.clientApplication.topologyManager.waitForReconnectionInstructions.waitFor();

  await expect(
    bravo.clientApplication.topologyManager.transitionToGameServer.waitFor()
  ).rejects.toThrow();
}

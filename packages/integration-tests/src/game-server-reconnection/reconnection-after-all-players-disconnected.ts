import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  GameStateUpdateType,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

// even if all players disconnect, it should not close the game
export async function testReconnectionAfterAllPlayersDisconnected(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({
    auth: options.useAuthenticatedUsers,
  });

  await alpha.clientApplication.gameClientRef.get().close();
  await bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );
  await bravo.clientApplication.gameClientRef.get().close();
  await alpha.connect();
  await alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  await alpha.gameClientHarness.awaitMessageOfType(GameStateUpdateType.GameFullUpdate);
  await bravo.connect();
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  await bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.GameFullUpdate);
  await alpha.gameClientHarness.awaitMessageOfType(GameStateUpdateType.PlayerJoinedGame);
}

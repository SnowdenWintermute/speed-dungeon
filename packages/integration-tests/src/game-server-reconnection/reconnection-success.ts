import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testReconnectionSuccess(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({
    auth: options.useAuthenticatedUsers,
  });

  await alpha.clientApplication.gameClientRef.get().close();

  await bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );
  await bravo.eventually(() => {
    const partyOption = bravo.clientApplication.gameContext.partyOption;
    invariant(partyOption !== undefined);
    expect(partyOption.playerUsernamesAwaitingReconnection.size > 0).toBeTruthy();
  });

  await alpha.connect();
  await bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.PlayerJoinedGame);
  await bravo.eventually(() => {
    const partyOption = bravo.clientApplication.gameContext.partyOption;
    invariant(partyOption !== undefined);
    expect(partyOption.playerUsernamesAwaitingReconnection.size === 0).toBeTruthy();
  });
}

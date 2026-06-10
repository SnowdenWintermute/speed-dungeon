import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  AbilityType,
  CharacterControlScheme,
  CombatActionName,
  CombatAttribute,
  GameMode,
  GameName,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
  Username,
} from "@speed-dungeon/common";

export async function testContinuedRunAfterUsernameChange(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // create a saved run with alpha and bravo users
  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });

  // alpha change username
  const alphaNewName = "alpha new name";
  testFixture.identityProviderQueryStrategy.changeUsername(
    TEST_AUTH_SESSION_ID_PLAYER_1,
    alphaNewName
  );
  await alpha.reconnectAsAuth(TEST_AUTH_SESSION_ID_PLAYER_1);
  // bravo change username
  testFixture.identityProviderQueryStrategy.changeUsername(
    TEST_AUTH_SESSION_ID_PLAYER_2,
    "bravo new name"
  );
  await bravo.reconnectAsAuth(TEST_AUTH_SESSION_ID_PLAYER_2);
  // alpha create game for continued run
  const alphaReceivedAlphaPlayerUsernameUpdate = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerUsernameUpdated
  );
  const alphaIronmanRunRef = alpha.clientApplication.lobbyContext.savedIronmanRuns
    .values()
    .next().value;
  invariant(
    alphaIronmanRunRef !== undefined,
    "expected alpha to have a reference to the shared run"
  );

  await alpha.lobbyClientHarness.createGame(
    "shared run" as GameName,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    alphaIronmanRunRef.gameId
  );
  // alpha receives "PlayerUsernameUpdated" message for alpha's player
  await alphaReceivedAlphaPlayerUsernameUpdate;

  const alphaReceivedBravoPlayerUsernameUpdate = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerUsernameUpdated
  );
  const bravoReceivedBravoPlayerUsernameUpdate = bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerUsernameUpdated
  );
  // bravo join game
  await bravo.lobbyClientHarness.joinGame(alphaIronmanRunRef.gameId);
  // alpha and bravo receive "PlayerUsernameUpdated" message for bravo's player
  await Promise.all([
    alphaReceivedBravoPlayerUsernameUpdate,
    bravoReceivedBravoPlayerUsernameUpdate,
  ]);
  // users ready up
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await bravo.lobbyClientHarness.toggleReadyToStartGame();
  // users receive game server connection instructions
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  // users can issue commands to characters
  alpha.clientApplication.errorRecordService.clear();
  const alphaPlayer = alpha.clientApplication.gameContext
    .requireGame()
    .getExpectedPlayer(alphaNewName as Username);
  console.log(
    "alpha player:",
    alphaPlayer.characterIds,
    "focused character id",
    alpha.clientApplication.combatantFocus.requireFocusedCharacter().getEntityId()
  );

  await alpha.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  console.log(alpha.clientApplication.errorRecordService.getErrors());
  expect(alpha.clientApplication.errorRecordService.count).toBe(0);
  bravo.clientApplication.errorRecordService.clear();
  await bravo.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  expect(bravo.clientApplication.errorRecordService.count).toBe(0);
}

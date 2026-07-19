import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, ERROR_MESSAGES, GameMode, invariant } from "@speed-dungeon/common";

export async function testAbandonUnownedIronmanRun(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // create saved run with alpha user
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  const gameId = alpha.clientApplication.lobbyContext.savedIronmanRuns.values().next()
    .value?.gameId;
  invariant(gameId !== undefined, "expected a game record to exist");
  // bravo user tries to abandon the run
  expect(bravo.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  await bravo.lobbyClientHarness.abandonIronmanRun(gameId);
  // error: you are not in that run
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.USER.NOT_GAME_PARTICIPANT
  );
}

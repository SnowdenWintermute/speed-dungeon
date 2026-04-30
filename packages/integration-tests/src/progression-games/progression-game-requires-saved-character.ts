import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";

export async function testCreateProgressionGameRequiresSavedCharacter(
  testFixture: IntegrationTestFixture
) {
  testFixture.resetWithOptions();
  const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS
  );
  alpha.clientApplication.errorRecordService.clear();
  await alpha.lobbyClientHarness.createSavedCharacter("character 1", CombatantClass.Warrior, 0);
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
  expect(alpha.clientApplication.errorRecordService.count).toBe(0);
  expect(alpha.clientApplication.gameContext.partyOption).toBeDefined();
}

export async function testJoinProgressionGameRequiresSavedCharacter(
  testFixture: IntegrationTestFixture
) {
  testFixture.resetWithOptions();
  await testFixture.createSingleClientInLobbyProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
  const bravo = testFixture.createClient("client 2", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();
  await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS
  );
  bravo.clientApplication.errorRecordService.clear();
  await bravo.lobbyClientHarness.createSavedCharacter("character 1", CombatantClass.Warrior, 0);
  await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
  expect(bravo.clientApplication.errorRecordService.count).toBe(0);
  expect(bravo.clientApplication.gameContext.partyOption).toBeDefined();
}

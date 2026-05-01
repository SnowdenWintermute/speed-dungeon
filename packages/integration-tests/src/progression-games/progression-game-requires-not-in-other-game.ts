import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";

export async function testProgressionGameRequiresNotInOtherGame(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  await alpha.lobbyClientHarness.createSavedCharacter("character 1", CombatantClass.Warrior, 0);
  await alpha.lobbyClientHarness.createGame("test-game-a", GameMode.Progression);
  expect(alpha.clientApplication.gameContext.partyOption).toBeDefined();
  // can't create game with another session (like other tab open)
  const bravo = testFixture.createClient("client 2", TEST_AUTH_SESSION_ID_PLAYER_1);
  await bravo.connect();
  await bravo.lobbyClientHarness.createGame("test-game-b", GameMode.Progression);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.LOBBY.USER_IN_GAME
  );
  bravo.clientApplication.errorRecordService.clear();
  // can't join game either
  await bravo.lobbyClientHarness.joinGame("test-game-a");
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.LOBBY.USER_IN_GAME
  );
}

import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED,
  CombatantClass,
  ERROR_MESSAGES,
  GameMode,
} from "@speed-dungeon/common";

export async function testCreateProgressionGameSelectCharacter(
  testFixture: IntegrationTestFixture
) {
  testFixture.resetWithOptions(undefined, BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED);
  // const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
  // await alpha.connect();
  // await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
  // expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
  //   ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS
  // );
  // alpha.clientApplication.errorRecordService.clear();
  // await alpha.lobbyClientHarness.createSavedCharacter("character 1", CombatantClass.Warrior, 0);
  // await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
  // expect(alpha.clientApplication.errorRecordService.count).toBe(0);
  // expect(alpha.clientApplication.gameContext.partyOption).toBeDefined();
}

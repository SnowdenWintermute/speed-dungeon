import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  ERROR_MESSAGES,
  GameMode,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testNoFloorSelection(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  await alpha.createSavedIronmanRun();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  await alpha.lobbyClientHarness.selectProgressionGameStartingFloor(1);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME.MODE
  );
}

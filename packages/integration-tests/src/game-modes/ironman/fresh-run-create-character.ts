import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, GameMode, TEST_DUNGEON_TWO_WOLF_ROOMS } from "@speed-dungeon/common";

export async function testFreshRunCreateCharacter(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);

  const game = alpha.clientApplication.gameContext.requireGame();
  const alphaPlayer = game.getExpectedPlayer(alpha.clientApplication.session.requireUsername());
  const alphaCharacterId = alphaPlayer.characterIds[0];
  expect(alphaCharacterId).toBeDefined();
}

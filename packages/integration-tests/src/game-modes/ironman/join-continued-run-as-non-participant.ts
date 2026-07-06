import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  ERROR_MESSAGES,
  GameMode,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testJoinContinuedRunAsNonParticipant(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  await alpha.createSavedIronmanRun();
  const alphasSoloRun = [...alpha.clientApplication.lobbyContext.savedIronmanRuns.values()][0];
  invariant(alphasSoloRun !== undefined, "expected alpha to have a saved ironman run");
  await alpha.lobbyClientHarness.createGame(
    TEST_GAME_NAME,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    alphasSoloRun.gameId
  );

  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  expect(bravo.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  await bravo.lobbyClientHarness.joinGame(alphasSoloRun.gameId);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME_SETUP.PLAYER_NOT_IN_CONTINUED_GAME
  );
}

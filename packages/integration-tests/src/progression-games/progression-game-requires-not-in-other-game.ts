import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME_2,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";

export async function testProgressionGameRequiresNotInOtherLobbyGame(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
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

export async function testProgressionGameRequiresNotInOtherGameServerGame(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { proceedToGameServer: true }
  );
  // can't create game with another session (like other tab open)
  const bravo = testFixture.createClient("client 2", TEST_AUTH_SESSION_ID_PLAYER_1);
  await bravo.connect();
  await bravo.lobbyClientHarness.createGame("test-game-b", GameMode.Progression);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.LOBBY.USER_IN_GAME
  );
  bravo.clientApplication.errorRecordService.clear();

  // can't join a lobby game setup either
  const charlie = await testFixture.createSingleClientInProgressionGame(
    "client 2",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    { gameName: TEST_GAME_NAME_2 }
  );
  await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME_2);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.LOBBY.USER_IN_GAME
  );
}

import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_GAME_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";

export async function testCreateProgressionGameRequiresAuth(testFixture: IntegrationTestFixture) {
  testFixture.resetWithOptions();
  const alpha = testFixture.createClient("client 1");
  await alpha.connect();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Progression);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.AUTH.REQUIRED
  );
}

export async function testJoinProgressionGameRequiresAuth(testFixture: IntegrationTestFixture) {
  testFixture.resetWithOptions();
  await testFixture.createSingleClientInLobbyProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
  const bravo = testFixture.createClient("client 1");
  await bravo.connect();
  await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
  expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.AUTH.REQUIRED
  );
}

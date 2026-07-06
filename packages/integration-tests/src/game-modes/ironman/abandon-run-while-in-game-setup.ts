import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  ERROR_MESSAGES,
  GameMode,
  GameName,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testAbandonRunWhileUserInGameSetup(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });

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

  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  expect(alpha.clientApplication.gameContext.requireGame().id).toBe(alphaIronmanRunRef.gameId);
  await alpha.lobbyClientHarness.abandonIronmanRun(alphaIronmanRunRef.gameId);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME_SETUP.CANT_ABANDON_WHILE_IN_SETUP
  );
  await alpha.lobbyClientHarness.leaveGame();
  expect(alpha.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(1);

  alpha.clientApplication.errorRecordService.clear();
  await alpha.lobbyClientHarness.abandonIronmanRun(alphaIronmanRunRef.gameId);
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  expect(alpha.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(0);
}

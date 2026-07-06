import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  GameMode,
  GameName,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testContinuedRunSetupAwaitsAllParticipants(
  testFixture: IntegrationTestFixture
) {
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
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  expect(alpha.clientApplication.topologyManager.transitionToGameServer.isArmed()).toBeFalsy();
  const game = alpha.clientApplication.gameContext.requireGame();
  expect(game.clock.isLive()).toBeFalsy();

  await bravo.lobbyClientHarness.joinGame(alphaIronmanRunRef.gameId);
  await bravo.lobbyClientHarness.toggleReadyToStartGame();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
}

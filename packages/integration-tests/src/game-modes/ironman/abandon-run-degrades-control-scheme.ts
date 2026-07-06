import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  GameMode,
  GameStateUpdateType,
  invariant,
} from "@speed-dungeon/common";

export async function testAbandonIronmanRunDegradesControlScheme(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, {
    closeGame: false,
    controlScheme: CharacterControlScheme.Freelancer,
  });
  // expect control scheme to be freelancers
  expect(alpha.clientApplication.gameContext.requireGame().characterControlScheme).toBe(
    CharacterControlScheme.Freelancer
  );

  // { close game
  alpha.clientApplication.gameClientRef.get().leaveGame();
  const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // bravo should be disconnected when other player leaves ironman game
  await bravoDisconnectedOnAlphaLeavePromise;
  await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // game closed }

  const expectedRunId = bravo.clientApplication.lobbyContext.savedIronmanRuns.values().next()
    .value?.gameId;

  // bravo abandon the run
  invariant(expectedRunId !== undefined);
  await bravo.lobbyClientHarness.abandonIronmanRun(expectedRunId);

  // alpha creates run, sees control scheme changed
  await alpha.lobbyClientHarness.createGame(
    TEST_GAME_NAME,
    GameMode.Ironman,
    CharacterControlScheme.Freelancer, // should do nothing since is continued run
    expectedRunId
  );

  expect(alpha.clientApplication.gameContext.requireGame().characterControlScheme).toBe(
    CharacterControlScheme.Captain
  );
}

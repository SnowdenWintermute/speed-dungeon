import { ClientFixture } from "@/fixtures/client-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatantClass,
  DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY,
  ERROR_MESSAGES,
  GameMode,
  GameName,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testAccountSavedIronmanRunLimitGameCreate(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // create saved runs up to the limit
  for (let i = 0; i < DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY; i += 1) {
    await createSavedIronmanRun(alpha);
  }
  // try to create fresh run - get error
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.USER.SAVED_GAME_CAPACITY
  );
}

// when a user has all saved run slots filled they may only join runs they are a participant in
export async function testAccountSavedIronmanRunLimitGameJoin(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // create saved solo run to fill account limit
  await createSavedIronmanRun(alpha);

  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // create a run that another user is a participant of
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  await bravo.lobbyClientHarness.tryJoinExpectedSingleGameInList();
  await bravo.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);

  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await bravo.lobbyClientHarness.toggleReadyToStartGame();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();

  alpha.clientApplication.gameClientRef.get().leaveGame();
  const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // bravo should be disconnected when other player leaves ironman game
  await bravoDisconnectedOnAlphaLeavePromise;
  await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // other client creates a fresh run
  await bravo.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);

  // try to join fresh run while at limit - get capacity error
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();

  await alpha.lobbyClientHarness.tryJoinExpectedSingleGameInList();

  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.USER.SAVED_GAME_CAPACITY
  );

  // other client creates shared run setup
  await bravo.lobbyClientHarness.leaveGame();
  console.log("bravo saved runs:", bravo.clientApplication.lobbyContext.savedIronmanRuns);
  // bravo should only have one saved run because their other created game never got past lobby
  // setup and thus would not have been saved, we can take the only existing run (the shared one)
  const bravoExpectedSavedRun = [
    ...bravo.clientApplication.lobbyContext.savedIronmanRuns.values(),
  ][0];
  invariant(bravoExpectedSavedRun !== undefined);
  await bravo.lobbyClientHarness.createGame(
    "shared run" as GameName,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    bravoExpectedSavedRun.gameId
  );

  // join shared run setup while at limit - success
  await alpha.lobbyClientHarness.tryJoinExpectedSingleGameInList();
  expect(alpha.clientApplication.gameContext.requireGame().id).toBe(bravoExpectedSavedRun.gameId);
}

async function createSavedIronmanRun(clientFixture: ClientFixture) {
  const { lobbyClientHarness, clientApplication } = clientFixture;
  await lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  await lobbyClientHarness.toggleReadyToStartGame();
  await clientApplication.sequentialEventProcessor.waitUntilIdle();
  await clientApplication.topologyManager.transitionToGameServer.waitFor();

  clientApplication.gameClientRef.get().leaveGame();
  await clientApplication.topologyManager.transitionToLobbyServer.waitFor();
}

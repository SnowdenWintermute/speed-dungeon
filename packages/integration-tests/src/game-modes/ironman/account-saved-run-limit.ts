import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
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
    await alpha.createSavedIronmanRun();
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
  await alpha.createSavedIronmanRun();

  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // create a run that another user is a participant of
  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });

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

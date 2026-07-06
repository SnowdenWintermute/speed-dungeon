import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  GameMode,
  GameName,
  GameStateUpdateType,
  invariant,
  ONE_SECOND,
  TEST_DUNGEON_EMPTY_ROOMS_WITH_STAIRCASE,
} from "@speed-dungeon/common";

export async function testContinuedRunTimeSpentOnFloor(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_EMPTY_ROOMS_WITH_STAIRCASE);
  testFixture.timeMachine.start();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  // - create fresh ironman game
  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo);
  // - spend some time on first floor
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  // leave game
  alpha.clientApplication.gameClientRef.get().leaveGame();
  const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  await bravoDisconnectedOnAlphaLeavePromise;
  await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // - spend some time outside the game
  testFixture.timeMachine.advanceTime(ONE_SECOND);

  // - create continued ironman game
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

  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await bravo.lobbyClientHarness.joinGame(alphaIronmanRunRef.gameId);
  await bravo.lobbyClientHarness.toggleReadyToStartGame();
  const bravoGotGameStartedMessage = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameStarted
  );
  const alphaGotGameStartedMessage = alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameStarted
  );
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await bravoGotGameStartedMessage;
  await alphaGotGameStartedMessage;
  // spend more time on floor
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  // - descend floor
  await bravo.gameClientHarness.toggleReadyToDescend();
  await alpha.gameClientHarness.toggleReadyToDescend();
  expect(
    alpha.clientApplication.gameContext
      .requireGame()
      .requireSingleParty()
      .dungeonExplorationManager.getCurrentFloor()
  ).toBe(2);

  // - expect time spent on floor records to reflect time spent
  //   in original game instance plus time spent in loaded instance
  const gameRecordAggregate = await testFixture.ladderGameRecordsService.getGameRecordAggregate(
    alphaIronmanRunRef.gameId
  );
  invariant(gameRecordAggregate !== undefined, "expected to have recorded a game record");
  const partyRecordAggregate = gameRecordAggregate.parties[0];
  invariant(partyRecordAggregate !== undefined, "expected to have recorded a party record");
  const floorClearRecord = partyRecordAggregate.floorClears[0];
  expect(floorClearRecord).toBeDefined();
  invariant(floorClearRecord !== undefined, "checked in above expect statement");
  expect(floorClearRecord.floor).toBe(1);
  expect(floorClearRecord.timeSpentOnFloor).toBe(ONE_SECOND * 2);
  expect(floorClearRecord.partyRecordRef).toBe(partyRecordAggregate.party.id);
}

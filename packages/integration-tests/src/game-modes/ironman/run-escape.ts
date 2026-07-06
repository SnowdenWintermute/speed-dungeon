import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  GAME_CONFIG,
  GameMode,
  GameStateUpdateType,
  invariant,
  PartyFateType,
  TEST_DUNGEON_EMPTY_ROOMS_WITH_STAIRCASE,
} from "@speed-dungeon/common";

export async function testIronmanRunEscape(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_EMPTY_ROOMS_WITH_STAIRCASE);
  testFixture.timeMachine.start();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // create run
  // start game
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  const gotConnectionInstructions = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const gameId = alpha.clientApplication.gameContext.requireGame().id;
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await gotConnectionInstructions;
  const gotGameStartedMessage = alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameStarted
  );
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await gotGameStartedMessage;

  // expect users in run have the run id in their profiles
  await expect(
    testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  ).resolves.toBeDefined();
  await alpha.gameClientHarness.toggleReadyToExplore();

  // escape
  GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = 2;
  await alpha.gameClientHarness.toggleReadyToDescend();
  // expect users in run no longer have the run id in their profiles
  expect(alpha.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(0);

  // expect the saved run to no longer exist
  await expect(
    testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  ).rejects.toThrow();
  // expect the party fate to be "Escaped" in the party record
  const gameRecordAggregate =
    await testFixture.ladderGameRecordsService.getGameRecordAggregate(gameId);
  invariant(gameRecordAggregate !== undefined, "expected to have recorded a game record");
  const partyRecordAggregate = gameRecordAggregate.parties[0];
  invariant(partyRecordAggregate !== undefined, "expected to have recorded a party record");
  expect(partyRecordAggregate.party.fateOption?.type).toBe(PartyFateType.Escape);

  GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE;
}

import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  GameMode,
  GameStateUpdateType,
  invariant,
  LOW_HP_CHARACTER_FIXTURES,
  PartyFateType,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testIronmanRunWipe(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, LOW_HP_CHARACTER_FIXTURES);
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

  // wipe

  await alpha.gameClientHarness.flushReplayTree();
  expect(alpha.clientApplication.gameContext.requireParty().hasWiped()).toBeTruthy();

  await alpha.clientApplication.gameClientRef.get().leaveGame();
  const gotIronmanRunsList = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.IronmanRunsList
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  await gotIronmanRunsList;

  // expect users in run no longer have the run id in their profiles
  expect(alpha.clientApplication.lobbyContext.savedIronmanRuns.size).toBe(0);

  // expect the saved run to no longer exist
  await expect(
    testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  ).rejects.toThrow();
  // expect the party fate to be "Wiped" in the party record

  const gameRecordAggregate =
    await testFixture.ladderGameRecordsService.getGameRecordAggregate(gameId);
  const partyRecord = gameRecordAggregate?.parties[0];
  expect(partyRecord).toBeDefined();
  invariant(partyRecord !== undefined, "checked above");
  expect(partyRecord.party.fateOption?.type).toBe(PartyFateType.Wipe);
}

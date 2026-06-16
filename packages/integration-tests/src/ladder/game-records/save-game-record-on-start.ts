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
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testSaveGameRecordOnGameStart(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();

  // create fresh ironman game
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  // get connection instructions
  const gotConnectionInstructions = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const gameId = alpha.clientApplication.gameContext.requireGame().id;
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  // expect to NOT find record in persistence service yet
  await gotConnectionInstructions;
  // await expect(
  //   testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  // ).rejects.toThrow();

  // // connect to game server
  // // get game time started message
  // const gotGameStartedMessage = alpha.gameClientHarness.awaitMessageOfType(
  //   GameStateUpdateType.GameStarted
  // );
  // await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  // await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  // await gotGameStartedMessage;
  // // expect to find saved record in persistence service
  // await expect(
  //   testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  // ).resolves.toBeDefined();
}

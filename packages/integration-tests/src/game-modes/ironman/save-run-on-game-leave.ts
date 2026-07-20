import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  CombatAttribute,
  GameMode,
  GameStateUpdateType,
  invariant,
  SavedIronmanRun,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testSaveRunOnGameLeave(testFixture: IntegrationTestFixture) {
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
  await expect(
    testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  ).rejects.toThrow();

  // connect to game server
  // get game time started message
  const gotGameStartedMessage = alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameStarted
  );
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await gotGameStartedMessage;
  // expect to find saved record in persistence service
  await expect(
    testFixture.userGameDataPersistenceService.requireIronmanRun(gameId)
  ).resolves.toBeDefined();
  // change some game state
  const game = alpha.clientApplication.gameContext.requireGame();
  const player = game.getExpectedPlayer(alpha.clientApplication.session.requireUsername());
  const playerSingleCharacterId = player.characterIds[0];
  invariant(playerSingleCharacterId !== undefined, "expected player to have a character");
  const playerCharacterBeforeGameLeave = game
    .requireSingleParty()
    .combatantManager.getExpectedCombatant(playerSingleCharacterId);
  const strengthStatBeforeAllocation =
    playerCharacterBeforeGameLeave.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    );

  await alpha.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  const strengthStatAfterAllocation =
    playerCharacterBeforeGameLeave.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    );
  expect(strengthStatAfterAllocation > strengthStatBeforeAllocation);

  // leave game
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // expect to find saved record in persistence service matching game state at time of leave
  const serializedRunAfterGameLeave =
    await testFixture.userGameDataPersistenceService.requireIronmanRun(gameId);
  const run = SavedIronmanRun.fromSerialized(serializedRunAfterGameLeave);
  const savedGameAfterLeave = run.game;
  const playerInSavedGame = savedGameAfterLeave.getExpectedPlayer(
    alpha.clientApplication.session.requireUsername()
  );
  const playerSingleCharacterIdInSavedGame = playerInSavedGame.characterIds[0];
  invariant(
    playerSingleCharacterIdInSavedGame !== undefined,
    "expected player to have a character"
  );
  const playerCharacterInSavedGame = game
    .requireSingleParty()
    .combatantManager.getExpectedCombatant(playerSingleCharacterId);
  expect(
    playerCharacterInSavedGame.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    )
  ).toBe(strengthStatAfterAllocation);
}

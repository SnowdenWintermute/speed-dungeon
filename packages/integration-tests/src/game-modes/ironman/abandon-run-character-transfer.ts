import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_SESSION_ID_PLAYER_3,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_2,
  TEST_AUTH_USERNAME_PLAYER_3,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_CHARACTER_NAME_3,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatantClass,
  GameMode,
  GameStateUpdateType,
  invariant,
} from "@speed-dungeon/common";

export async function testCharacterTransferAfterAbandonedIronmanRun(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const [alpha, bravo, charlie] = await testFixture.createConnectedClients([
    { id: "alpha", authSessionId: TEST_AUTH_SESSION_ID_PLAYER_1 },
    { id: "bravo", authSessionId: TEST_AUTH_SESSION_ID_PLAYER_2 },
    { id: "charlie", authSessionId: TEST_AUTH_SESSION_ID_PLAYER_3 },
  ]);

  // get all three players in a game, each with one character
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  const alphaCharacterName = TEST_CHARACTER_NAME_1;
  await alpha.lobbyClientHarness.createCharacter(alphaCharacterName, CombatantClass.Warrior);
  await bravo.lobbyClientHarness.tryJoinExpectedSingleGameInList();
  const bravoCharacterName = TEST_CHARACTER_NAME_2;
  await bravo.lobbyClientHarness.createCharacter(bravoCharacterName, CombatantClass.Warrior);
  await charlie.lobbyClientHarness.tryJoinExpectedSingleGameInList();
  await charlie.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_3, CombatantClass.Warrior);

  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await bravo.lobbyClientHarness.toggleReadyToStartGame();
  await charlie.lobbyClientHarness.toggleReadyToStartGame();

  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await bravo.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();
  await charlie.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await charlie.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();

  // close the game
  alpha.clientApplication.gameClientRef.get().leaveGame();
  const bravoDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  const charlieDisconnectedOnAlphaLeavePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameClosed
  );
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  // remaining players should be disconnected when other player leaves ironman game
  await bravoDisconnectedOnAlphaLeavePromise;
  await bravo.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  await charlieDisconnectedOnAlphaLeavePromise;
  await charlie.clientApplication.topologyManager.transitionToLobbyServer.waitFor();

  // alpha abandon run
  const gameId = alpha.clientApplication.lobbyContext.savedIronmanRuns.values().next()
    .value?.gameId;
  invariant(gameId !== undefined, "expected a saved ironman run in the client's list");

  await alpha.lobbyClientHarness.abandonIronmanRun(gameId);

  // bravo see's alpha player no longer in the run
  await bravo.lobbyClientHarness.createGame(
    TEST_GAME_NAME,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    gameId
  );
  const bravoHostedGameAfterAlphaAbandoned = bravo.clientApplication.gameContext.requireGame();
  expect(
    bravoHostedGameAfterAlphaAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_1)
  ).toBeFalsy();
  expect(
    bravoHostedGameAfterAlphaAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_2)
  ).toBeTruthy();
  expect(
    bravoHostedGameAfterAlphaAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_3)
  ).toBeTruthy();

  // bravo sees all characters owned by user bravo's player
  const bravoPlayer = bravoHostedGameAfterAlphaAbandoned.getPlayer(TEST_AUTH_USERNAME_PLAYER_2);
  invariant(bravoPlayer !== undefined);
  expect(
    [...bravoPlayer.getCharactersInGame(bravoHostedGameAfterAlphaAbandoned).values()].find(
      (character) => {
        return character.getName() === alphaCharacterName;
      }
    )
  ).toBeDefined();

  // bravo abandons
  await bravo.lobbyClientHarness.leaveGame();
  await bravo.lobbyClientHarness.abandonIronmanRun(gameId);

  await charlie.lobbyClientHarness.createGame(
    TEST_GAME_NAME,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    gameId
  );
  const charlieHostedGameAfterBravoAbandoned = charlie.clientApplication.gameContext.requireGame();
  expect(
    charlieHostedGameAfterBravoAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_1)
  ).toBeFalsy();
  expect(
    charlieHostedGameAfterBravoAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_2)
  ).toBeFalsy();
  expect(
    charlieHostedGameAfterBravoAbandoned.getPlayers().has(TEST_AUTH_USERNAME_PLAYER_3)
  ).toBeTruthy();

  // charlie now owns all characters
  const charliePlayer = charlieHostedGameAfterBravoAbandoned.getPlayer(TEST_AUTH_USERNAME_PLAYER_3);
  invariant(charliePlayer !== undefined);
  expect(
    [...charliePlayer.getCharactersInGame(charlieHostedGameAfterBravoAbandoned).values()].length
  ).toBe(3);
}

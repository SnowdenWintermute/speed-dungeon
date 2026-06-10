import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_SESSION_ID_PLAYER_2 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  ClientIntentType,
  CombatAttribute,
  GameMode,
  GameName,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testAbandonRunWhileOtherUserInLobbySetup(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_2);
  await bravo.connect();

  await testFixture.putTwoClientsInFreshIronmanRun(alpha, bravo, { closeGame: true });

  // player 1 creates lobby setup for continued run
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
  expect(alpha.clientApplication.gameContext.requireGame().id).toBe(alphaIronmanRunRef.gameId);

  const game = alpha.clientApplication.gameContext.requireGame();
  expect(game.players.size).toBe(2);
  const alphaPlayer = game.getExpectedPlayer(alpha.clientApplication.session.requireUsername());
  expect(alphaPlayer.characterIds.length).toBe(1);

  const alphaSeesBravoAbandonedRun = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.IronmanRunAbandoned
  );
  // player 1 toggles ready before player 2 may join
  console.log("alpha readies before bravo abandons");
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  // player 2 abandons run
  await bravo.lobbyClientHarness.abandonIronmanRun(alphaIronmanRunRef.gameId);
  // player 1 sees characters transfer
  await alphaSeesBravoAbandonedRun;
  expect(game.players.size).toBe(1);
  expect(alphaPlayer.characterIds.length).toBe(2);
  // player 1 can ready up and start game
  expect(alpha.clientApplication.topologyManager.transitionToGameServer.isArmed()).toBeFalsy();
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForStartedOrCompleted();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitForOrCompleted();

  // player 1 can control inherited characters
  for (const characterId of alphaPlayer.characterIds) {
    await alpha.gameClientHarness.settleIntentResult({
      type: ClientIntentType.IncrementAttribute,
      data: {
        characterId,
        attribute: CombatAttribute.Strength,
      },
    });
  }
  console.log(alpha.clientApplication.errorRecordService.getErrors());
  expect(alpha.clientApplication.errorRecordService.count).toBe(0);
}

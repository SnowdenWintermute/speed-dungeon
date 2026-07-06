import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatActionName,
  CombatantClass,
  GameId,
  GameMode,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";
import isEqual from "lodash.isequal";

export async function testContinuedRunPreservesState(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
  testFixture.timeMachine.start();
  const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  await alpha.connect();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  await alpha.clientApplication.sequentialEventProcessor.waitUntilIdle();
  await alpha.clientApplication.topologyManager.transitionToGameServer.waitFor();

  const game = alpha.clientApplication.gameContext.requireGame();
  const party = alpha.clientApplication.gameContext.requireParty();

  await alpha.gameClientHarness.toggleReadyToExplore();
  await alpha.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
  const focusedCharacterHpBeforeAction =
    focusedCharacter.combatantProperties.resources.getHitPoints();
  const currentTargetId = focusedCharacter.getTargetingProperties().requireSelectedSingleTargetId();
  const targetCombatant = party.combatantManager.getExpectedCombatant(currentTargetId);
  const targetHpBeforeAttack = targetCombatant.combatantProperties.resources.getHitPoints();
  await alpha.gameClientHarness.useSelectedCombatAction();
  const targetHpAfterAttack = targetCombatant.combatantProperties.resources.getHitPoints();
  const focusedCharacterHpAfterAction =
    focusedCharacter.combatantProperties.resources.getHitPoints();
  expect(targetHpAfterAttack < targetHpBeforeAttack);
  expect(focusedCharacterHpAfterAction < focusedCharacterHpBeforeAction);
  const turnOrderBeforeLeaveGame = party.requireBattle(game).turnOrderManager.getTrackers();

  alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  const { savedIronmanRuns } = alpha.clientApplication.lobbyContext;
  const savedRunId = [...savedIronmanRuns.keys()][0];
  invariant(savedRunId !== undefined, "expected a saved ironman run id");
  await alpha.lobbyClientHarness.createGame(
    TEST_GAME_NAME,
    GameMode.Ironman,
    CharacterControlScheme.Captain,
    savedRunId as GameId
  );
  await alpha.lobbyClientHarness.toggleReadyToStartGame();
  const gameAfterGameLoad = alpha.clientApplication.gameContext.requireGame();
  const partyAfterGameLoad = alpha.clientApplication.gameContext.requireParty();
  const targetCombatantInLoadedRun =
    partyAfterGameLoad.combatantManager.getExpectedCombatant(currentTargetId);
  const targetCombatantInLoadedRunHp =
    targetCombatantInLoadedRun.combatantProperties.resources.getHitPoints();
  expect(targetCombatantInLoadedRunHp).toEqual(targetHpAfterAttack);
  const turnOrderInLoadedRun = partyAfterGameLoad
    .requireBattle(gameAfterGameLoad)
    .turnOrderManager.getTrackers();
  const turnTrackersAreEqual = isEqual(turnOrderBeforeLeaveGame, turnOrderInLoadedRun);
  expect(turnTrackersAreEqual).toBeTruthy();
}

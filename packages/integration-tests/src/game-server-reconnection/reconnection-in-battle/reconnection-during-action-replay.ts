import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  DungeonRoomType,
  GameStateUpdateType,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testReconnectionDuringActionReplay(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();

  const { alpha, bravo } = await testFixture.createTwoClientsInFirstMonsterLair({
    auth: options.useAuthenticatedUsers,
  });

  await alpha.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await Promise.all([
    alpha.gameClientHarness.dispatchAndAwaitReply({
      type: ClientIntentType.UseSelectedCombatAction,
      data: { characterId: alpha.clientApplication.combatantFocus.requireFocusedCharacterId() },
    }),
    bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.ClientSequentialEvents),
  ]);

  const partialReplayStoppingPoint = {
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.AttackMeleeMainhand,
    step: ActionResolutionStepType.RollIncomingHitOutcomes,
  };
  await Promise.all([
    alpha.gameClientHarness.flushReplayTree(partialReplayStoppingPoint),
    bravo.gameClientHarness.flushReplayTree(partialReplayStoppingPoint),
  ]);

  await bravo.clientApplication.gameClientRef.get().close();

  await alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );

  await bravo.connect();
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const reconnectionFullGameUpdatePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameFullUpdate
  );
  await alpha.gameClientHarness.awaitMessageOfType(GameStateUpdateType.PlayerJoinedGame);
  const reconnectionFullGameUpdate = await reconnectionFullGameUpdatePromise;

  await alpha.gameClientHarness.flushReplayTree();

  // after reconnect
  const party = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
  const game = bravo.gameClientHarness.clientApplication.gameContext.requireGame();

  party.currentRoom.requireType(DungeonRoomType.MonsterLair);
  expect(party.requireBattle(game).turnOrderManager.getTrackers()).toStrictEqual(
    alpha.clientApplication.gameContext
      .requireParty()
      .requireBattle(alpha.clientApplication.gameContext.requireGame())
      .turnOrderManager.getTrackers()
  );
  expect(party.inputLock.isLocked()).toBeTruthy();

  expect(bravo.clientApplication.uiStore.replayResolutionTimeoutDuration > 0).toBeTruthy();
  testFixture.timeMachine.advanceTime(
    bravo.clientApplication.uiStore.replayResolutionTimeoutDuration
  );
  expect(party.inputLock.isLocked()).toBeFalsy();
}

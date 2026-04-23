import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  ClientIntentType,
  CombatActionName,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_ONE_HP_WOLVES,
} from "@speed-dungeon/common";

export async function testReconnectionDuringVictoryReplay(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_ONE_HP_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInFirstMonsterLair();
  await alpha.gameClientHarness.useCombatAction(CombatActionName.Attack);
  await bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.ClientSequentialEvents);

  await bravo.gameClientHarness.flushReplayTree();
  console.log("bravo flushed after alpha attack");
  await bravo.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  const bravoCombatantFocus = bravo.clientApplication.combatantFocus;
  await bravo.gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: bravoCombatantFocus.requireFocusedCharacterId() },
  });

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
  console.log("alpha flushed");
  bravo.clientApplication.sequentialEventProcessor.cancelQueued();
  bravo.clientApplication.sequentialEventProcessor.clearCurrent();
  await bravo.clientApplication.sequentialEventProcessor.waitUntilIdle();

  const alphaParty = alpha.clientApplication.gameContext.requireParty();
  const bravoParty = bravo.clientApplication.gameContext.requireParty();
  expect(bravoParty.battleId).toBeNull();
  expect(bravoParty.currentRoom.inventory.getItems().length).toBe(2);
  expect(alphaParty.currentRoom.inventory.getItems().length).toBe(2);
  const itemIdForBravo = bravoParty.currentRoom.inventory.getItems()[0];
  invariant(itemIdForBravo !== undefined);
  console.log(
    "bravo replaytree:",
    bravo.clientApplication.replayTreeScheduler.current,
    "pending events",
    bravo.clientApplication.sequentialEventProcessor.pendingEvents
  );
  await bravo.gameClientHarness.pickUpItem(itemIdForBravo.getEntityId());

  // submit action expected to kill last monster
  // await and advance time flush tree to midway through replay
  // reconnect
  // assert items on ground but can not be picked up
  // assert input locked while replay still playing out
  // assert items on ground / no longer in battle
  // items can be picked up by both players
  // items can be dropped by both players without incident
}

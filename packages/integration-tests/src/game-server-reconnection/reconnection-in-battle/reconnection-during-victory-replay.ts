import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  ClientIntentType,
  CombatActionName,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_ONE_HP_WOLVES,
} from "@speed-dungeon/common";

// submit action expected to kill last monster
// await and advance time flush tree to midway through replay
// reconnect
// assert items on ground but can not be picked up
// assert input locked while replay still playing out
// assert items on ground / no longer in battle
// items can be picked up by both players
// items can be dropped by both players without incident

export async function testReconnectionDuringVictoryReplay(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_ONE_HP_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInFirstMonsterLair({
    auth: options.useAuthenticatedUsers,
  });
  await alpha.gameClientHarness.useCombatAction(CombatActionName.Attack);
  await bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.ClientSequentialEvents);

  await bravo.gameClientHarness.flushReplayTree();
  await bravo.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  const bravoCombatantFocus = bravo.clientApplication.combatantFocus;
  await bravo.gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: bravoCombatantFocus.requireFocusedCharacterId() },
  });

  await bravo.clientApplication.gameClientRef.get().close();
  // if browser refreshes, there would be an entirely different clientApplication
  bravo.clientApplication.sequentialEventProcessor.cancelQueued();
  bravo.clientApplication.sequentialEventProcessor.resetChain();

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
  const _reconnectionFullGameUpdate = await reconnectionFullGameUpdatePromise;
  await alpha.gameClientHarness.flushReplayTree();

  const alphaParty = alpha.clientApplication.gameContext.requireParty();
  const bravoParty = bravo.clientApplication.gameContext.requireParty();
  expect(bravoParty.battleId).toBeNull();
  expect(bravoParty.currentRoom.inventory.getItems().length).toBe(2);
  expect(alphaParty.currentRoom.inventory.getItems().length).toBe(2);
  const itemForBravo = bravoParty.currentRoom.inventory.getItems()[0];
  invariant(itemForBravo !== undefined);

  await bravo.gameClientHarness.pickUpItem(itemForBravo.getEntityId());
  expect(
    bravo.clientApplication.combatantFocus
      .requireFocusedCharacter()
      .getInventoryOption()
      ?.getItems()
      .find((item) => item.getEntityId() === itemForBravo.getEntityId())
  ).toBeDefined();

  const itemForAlpha = alphaParty.currentRoom.inventory.getItems()[0];
  invariant(itemForAlpha !== undefined);
  await alpha.gameClientHarness.pickUpItem(itemForAlpha.getEntityId());
  expect(
    alpha.clientApplication.combatantFocus
      .requireFocusedCharacter()
      .getInventoryOption()
      ?.getItems()
      .find((item) => item.getEntityId() === itemForAlpha.getEntityId())
  ).toBeDefined();

  await Promise.all([
    bravo.gameClientHarness.dropItem(itemForBravo.getEntityId()),
    alpha.gameClientHarness.dropItem(itemForAlpha.getEntityId()),
  ]);
  expect(alphaParty.currentRoom.inventory.getItems().length).toBe(2);
  expect(bravoParty.currentRoom.inventory.getItems().length).toBe(2);
}

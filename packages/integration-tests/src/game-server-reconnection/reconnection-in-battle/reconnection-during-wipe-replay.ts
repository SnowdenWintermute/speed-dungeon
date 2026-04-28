import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ClientIntentType,
  CombatActionName,
  GameStateUpdateType,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

// - submit action expected to resolve in party wipe
// - shows "resolving replay in progress"
// - shows party wiped

export async function testReconnectionDuringWipeReplay(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInFirstMonsterLair({
    auth: options.useAuthenticatedUsers,
  });
  await alpha.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  const alphaCombatantFocus = bravo.clientApplication.combatantFocus;
  await alpha.gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: alphaCombatantFocus.requireFocusedCharacterId() },
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
  const reconnectionFullGameUpdate = await reconnectionFullGameUpdatePromise;

  expect(bravo.clientApplication.uiStore.replayResolutionTimeoutDuration).toBeGreaterThan(0);
  const alphaTicked = await alpha.gameClientHarness.flushReplayTree();
  await bravo.gameClientHarness.flushReplayTree();
  testFixture.timeMachine.advanceTime(alphaTicked);
  expect(bravo.clientApplication.uiStore.replayResolutionTimeoutDuration).toBe(0);

  const alphaParty = alpha.clientApplication.gameContext.requireParty();
  const bravoParty = bravo.clientApplication.gameContext.requireParty();
  expect(alphaParty.battleId).toBeNull();
  expect(bravoParty.battleId).toBeNull();
  expect(alphaParty.timeOfWipe).toBeTruthy();
  expect(bravoParty.timeOfWipe).toBeTruthy();
}

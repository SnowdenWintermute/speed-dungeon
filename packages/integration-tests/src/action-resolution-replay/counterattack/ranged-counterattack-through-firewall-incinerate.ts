import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  EPSILON,
  FixedNumberGenerator,
  LOW_HP_CHARACTER_FIXTURES,
  NextOrPrevious,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testRangedCounterattackThroughFirewallIncinerate(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, LOW_HP_CHARACTER_FIXTURES, {
    counterAttack: new FixedNumberGenerator(1 - EPSILON),
  });
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;

  await gameClientHarness.selectHoldableHotswapSlot(1);
  combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  await gameClientHarness.selectHoldableHotswapSlot(1);

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.selectCombatAction(CombatActionName.Firewall, 3);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  // just make sure the action is triggered, checking if it doesn't damage targets
  // would be complicated here because they are being damaged by the firewall, and we
  // check this in the dedicated firewall incinerates projectiles test
  await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.IncinerateProjectile,
    step: ActionResolutionStepType.EvalOnHitOutcomeTriggers,
  });
  await gameClientHarness.flushReplayTree();
}

import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionEntityName,
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  CombatActionResource,
  MagicalElement,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
  invariant,
} from "@speed-dungeon/common";

export async function testFirewallIgnitesProjectiles(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLVES,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.selectHoldableHotswapSlot(1);
  clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  await gameClientHarness.selectHoldableHotswapSlot(1);

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 2);

  await gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.IgniteProjectile,
    step: ActionResolutionStepType.EvalOnUseTriggers,
  });
  const arrow = party.actionEntityManager.getExistingActionEntityOfType(ActionEntityName.Arrow);
  invariant(arrow !== null);
  const { actionOriginData } = arrow.getActionEntityProperties();
  invariant(actionOriginData !== undefined);
  const { resourceChangeProperties } = actionOriginData;
  invariant(resourceChangeProperties !== undefined);
  const hpChangeProperties = resourceChangeProperties[CombatActionResource.HitPoints];
  invariant(hpChangeProperties !== undefined);
  expect(hpChangeProperties.resourceChangeSource.elementOption).toBe(MagicalElement.Fire);
}

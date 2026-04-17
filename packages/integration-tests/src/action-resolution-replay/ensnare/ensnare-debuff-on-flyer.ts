import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantConditionName,
  MonsterType,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_MANTAS,
} from "@speed-dungeon/common";

export async function testEnsnareDebuffOnFlyer(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_MANTAS,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent);

  await gameClientHarness.toggleReadyToExplore();
  const attackUserId = combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(CombatActionName.Attack);
  const attackTargetId = actionHistory.requireLastUsedActionSingleTargetId(attackUserId);
  console.log("ENSNARE DEBUFF TARGET ID:", attackTargetId);
  const attackTargetCombatantProperties = combatantManager
    .getExpectedCombatant(attackTargetId)
    .getCombatantProperties();
  expect(
    attackTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.Flying
    )
  ).toBeDefined();
  // didn't hit the flying target with melee attack
  expect(
    attackTargetCombatantProperties.resources.getResourcePercentagesOfMax().percentOfMaxHitPoints
  ).toBe(1);
  await gameClientHarness.useCombatAction(CombatActionName.Ensnare);
  expect(
    attackTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.Flying
    )
  ).toBeUndefined();
  expect(
    attackTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.Ensnared
    )
  ).toBeDefined();
  // can now hit ensnared target
  await gameClientHarness.useCombatAction(CombatActionName.Attack);
  expect(
    attackTargetCombatantProperties.resources.getResourcePercentagesOfMax().percentOfMaxHitPoints <
      1
  ).toBeTruthy();
  const webAttacker = combatantFocus.requireFocusedCharacter().combatantProperties;
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 3);
  await gameClientHarness.cycleTargets(NextOrPrevious.Previous);
  const targetWebId = webAttacker.targetingProperties.requireSelectedSingleTargetId();
  const web = combatantManager.getExpectedCombatant(targetWebId);
  expect(web.combatantProperties.monsterType).toBe(MonsterType.Net);
  await gameClientHarness.useSelectedCombatAction();
  expect(
    attackTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.Ensnared
    )
  ).toBeUndefined();
  expect(
    attackTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.Flying
    )
  ).toBeDefined();
}

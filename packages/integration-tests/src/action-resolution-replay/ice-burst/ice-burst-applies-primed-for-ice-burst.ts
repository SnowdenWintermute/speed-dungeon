import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantConditionName,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testIceBurstAppliesPrimedForIceBurst(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);

  const client = await testFixture.createSingleClientInStartedGame();

  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;

  await gameClientHarness.toggleReadyToExplore();
  const iceBoltUserId = combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  const iceBoltTargetId = actionHistory.requireLastUsedActionSingleTargetId(iceBoltUserId);
  const iceBoltTargetCombatantProperties = combatantManager
    .getExpectedCombatant(iceBoltTargetId)
    .getCombatantProperties();
  expect(iceBoltTargetCombatantProperties.isDead()).toBeFalsy();
  expect(
    iceBoltTargetCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.PrimedForIceBurst
    )
  ).toBeDefined();

  const attackUserCombatantProperties = combatantFocus
    .requireFocusedCharacter()
    .getCombatantProperties();
  expect(
    attackUserCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.PrimedForIceBurst
    )
  ).toBeUndefined();
  const otherWolf = combatantManager
    .getDungeonControlledCombatants()
    .find(
      (combatant) =>
        !combatant
          .getCombatantProperties()
          .conditionManager.getConditionByName(CombatantConditionName.PrimedForIceBurst)
    );
  invariant(otherWolf !== undefined, "expected other wolf with no ice burst condition");
  await gameClientHarness.useCombatAction(CombatActionName.Attack);
  // hits melee attacker
  expect(
    attackUserCombatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.PrimedForIceBurst
    )
  ).toBeDefined();
  // hits nearby ally wolf
  expect(
    otherWolf
      .getCombatantProperties()
      .conditionManager.getConditionByName(CombatantConditionName.PrimedForIceBurst)
  ).toBeDefined();
}

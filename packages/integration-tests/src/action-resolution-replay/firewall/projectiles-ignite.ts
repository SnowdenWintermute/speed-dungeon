import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testFirewallIgnitesProjectiles(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLVES,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.selectHoldableHotswapSlot(1);
  clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  await gameClientHarness.selectHoldableHotswapSlot(1);

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  const monsters = party.combatantManager.getDungeonControlledCombatants();
  for (const monster of monsters) {
    expect(
      monster.combatantProperties.resources.getResourcePercentagesOfMax().percentOfMaxHitPoints
    ).toBe(1);
  }
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);
  await gameClientHarness.useCombatAction(CombatActionName.ChainingSplitArrowParent, 1);
  for (const monster of monsters) {
    expect(
      monster.combatantProperties.resources.getResourcePercentagesOfMax().percentOfMaxHitPoints
    ).toBe(1);
  }
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent, 1);
  for (const monster of monsters) {
    expect(
      monster.combatantProperties.resources.getResourcePercentagesOfMax().percentOfMaxHitPoints
    ).toBe(1);
  }
}

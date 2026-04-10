import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionEntityName,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
  invariant,
} from "@speed-dungeon/common";

export async function testFirewallStokedOnRecast(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLVES,
    BASIC_CHARACTER_FIXTURES
  );

  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  await gameClientHarness.toggleReadyToExplore();

  // firewall can be stoked by recast
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);
  const firewallOption = party.actionEntityManager.getExistingActionEntityOfType(
    ActionEntityName.Firewall
  );
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 1);
  invariant(firewallOption !== null);
  expect(firewallOption.getLevel()).toBe(3);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(4);
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 1);
  expect(firewallOption.getLevel()).toBe(3);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(6);
  // existing firewall can be increased in rank by higher rank spell cast
  for (let i = 0; i < 7; i += 1) {
    await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  }
  expect(firewallOption.getLevel()).toBe(1);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(1);
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 2);
  expect(firewallOption.getLevel()).toBe(2);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(2);
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);
  expect(firewallOption.getLevel()).toBe(3);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(5);
}

import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionEntityName,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
  invariant,
} from "@speed-dungeon/common";

export async function testFirewallDeteriorates(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  await gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 3);
  let firewallOption = party.actionEntityManager.getExistingActionEntityOfType(
    ActionEntityName.Firewall
  );
  invariant(firewallOption !== null);
  expect(firewallOption.getLevel()).toBe(3);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(3);
  await gameClientHarness.passTurns(7);
  expect(firewallOption.getLevel()).toBe(2);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(2);
  await gameClientHarness.passTurns(2);
  expect(firewallOption.getLevel()).toBe(1);
  expect(firewallOption.getActionEntityProperties().requireStackCount()).toBe(1);
  await gameClientHarness.passTurns(2);
  firewallOption = party.actionEntityManager.getExistingActionEntityOfType(
    ActionEntityName.Firewall
  );
  expect(firewallOption).toBeNull();
}

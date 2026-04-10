import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionEntityName,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testFirewallDissipateOnExplore(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLVES,
    BASIC_CHARACTER_FIXTURES
  );

  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 1);
  await gameClientHarness.toggleReadyToExplore();
  expect(party.actionEntityManager.getExistingActionEntityOfType(ActionEntityName.Firewall)).toBe(
    null
  );
}

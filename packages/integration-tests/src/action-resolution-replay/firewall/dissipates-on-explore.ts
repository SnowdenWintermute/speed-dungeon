import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionEntityName,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testFirewallDissipateOnExplore(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);
  const client = await testFixture.createClientInGame();

  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 1);
  await gameClientHarness.toggleReadyToExplore();
  expect(party.actionEntityManager.getExistingActionEntityOfType(ActionEntityName.Firewall)).toBe(
    null
  );
}

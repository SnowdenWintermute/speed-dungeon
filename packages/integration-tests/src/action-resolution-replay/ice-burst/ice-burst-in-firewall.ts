import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantConditionName,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testIceBurstTriggeredByFirewall(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  await gameClientHarness.useCombatAction(CombatActionName.Firewall);
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  expect(
    [...combatantManager.getAllCombatants()].find(([_, combatant]) =>
      combatant
        .getCombatantProperties()
        .conditionManager.getConditionByName(CombatantConditionName.PrimedForIceBurst)
    )
  ).toBeUndefined();
}

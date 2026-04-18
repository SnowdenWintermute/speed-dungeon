import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CHARARCTER_FIXTURES_WITH_PET_MANTAS,
  CombatActionName,
  NextOrPrevious,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
} from "@speed-dungeon/common";

export async function testIceBurstOnWebRemovedAtBattleEnd(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_TWO_SPIDER_ROOMS,
    CHARARCTER_FIXTURES_WITH_PET_MANTAS
  );
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent);
  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 3);
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 3);
  await gameClientHarness.cycleTargetingSchemes();
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();
  expect(clientApplication.errorRecordService.getErrors().length).toBe(0);
}

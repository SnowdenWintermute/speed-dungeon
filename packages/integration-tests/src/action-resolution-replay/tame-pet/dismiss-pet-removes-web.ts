import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CHARARCTER_FIXTURES_WITH_PETS,
  CombatActionName,
  CombatantCondition,
  CombatantConditionName,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
} from "@speed-dungeon/common";

export async function testDismissPetRemovesWeb(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_SPIDER_ROOMS, CHARARCTER_FIXTURES_WITH_PETS);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  const { combatantManager } = party;

  await client.gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);

  const neutralCombatantCountBeforeDismiss = combatantManager.getNeutralCombatants().length;
  const wolf = combatantManager.getPartyMemberPets()[0];
  invariant(wolf !== undefined, "no pet after summon");

  await gameClientHarness.useCombatAction(CombatActionName.DismissPet, 1);
  expect(combatantManager.getNeutralCombatants().length).toBeLessThan(
    neutralCombatantCountBeforeDismiss
  );
}

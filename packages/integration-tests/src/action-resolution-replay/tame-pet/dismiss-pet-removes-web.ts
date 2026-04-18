import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA,
} from "@speed-dungeon/common";

export async function testDismissPetRemovesWeb(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_WOLF_AND_SLOW_SPIDER_LOTS_OF_MANA,
    BASIC_CHARACTER_FIXTURES
  );
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  const { combatantManager } = party;

  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);

  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(1);

  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.DismissPet, 1);
  expect(combatantManager.getNeutralCombatants().length).toBe(0);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  const wolf = combatantManager.getPartyMemberPets()[0];
  invariant(wolf !== undefined, "no pet after summon");
  expect(wolf.getCombatantProperties().conditionManager.getConditions().length).toBe(0);
}

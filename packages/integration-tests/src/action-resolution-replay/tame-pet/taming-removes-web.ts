import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  invariant,
  TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
} from "@speed-dungeon/common";

export async function testTamingRemovesWeb(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  const { combatantManager } = party;

  expect(combatantManager.getDungeonControlledCharacters().length).toBe(2);
  await gameClientHarness.useCombatAction(CombatActionName.Ensnare, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(2);
  expect(combatantManager.getNeutralCombatants().length).toBe(1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(1);
  expect(combatantManager.getNeutralCombatants().length).toBe(0);
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  expect(combatantManager.getPartyMemberPets().length).toBe(1);
  const expectedPet = combatantManager.getPartyMemberPets()[0];
  invariant(expectedPet !== undefined);
  expect(expectedPet.getCombatantProperties().conditionManager.getConditions().length).toBe(0);
}

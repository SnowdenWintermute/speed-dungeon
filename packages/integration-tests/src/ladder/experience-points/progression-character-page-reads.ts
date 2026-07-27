import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_CHARACTER_NAME_1,
} from "@/fixtures/consts";
import {
  CHARARCTER_FIXTURES_WITH_PETS,
  CharacterControlScheme,
  Combatant,
  CombatantClass,
  invariant,
} from "@speed-dungeon/common";

export async function testProgressionCharacterPageReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(undefined, CHARARCTER_FIXTURES_WITH_PETS);

  const alpha = await testFixture.createSingleClientWithSavedCharacters(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      characters: [{ name: TEST_CHARACTER_NAME_1, combatantClass: CombatantClass.Warrior }],
      controlScheme: CharacterControlScheme.Freelancer,
    }
  );

  const ownCharacterOption =
    alpha.clientApplication.lobbyContext.savedCharacters.byControlScheme[
      CharacterControlScheme.Freelancer
    ][0];
  invariant(ownCharacterOption !== undefined, "expected the character alpha just created");
  const ownCombatant = ownCharacterOption.combatant;
  expect(ownCombatant.combatantProperties.inventory.getItemsCount()).toBeGreaterThan(0);

  const ladderQueries = await testFixture.createLadderViewerQueries();
  const viewOption = await ladderQueries.getProgressionCharacter(ownCombatant.getEntityId());
  invariant(viewOption !== undefined, "expected alpha's saved character to be readable");

  expect(viewOption.ownerUsername).toBe(TEST_AUTH_USERNAME_PLAYER_1);
  expect(viewOption.controlScheme).toBe(CharacterControlScheme.Freelancer);

  const combatant = Combatant.fromSerialized(viewOption.combatantWithPets.combatant);
  expect(combatant.getEntityId()).toBe(ownCombatant.getEntityId());
  expect(combatant.entityProperties.name).toBe(TEST_CHARACTER_NAME_1);

  expect(equippedItemIds(combatant)).toEqual(equippedItemIds(ownCombatant));
  expect(equippedItemIds(combatant).length).toBeGreaterThan(0);
  expect(combatant.getTotalAttributes()).toEqual(ownCombatant.getTotalAttributes());
  expect([...combatant.combatantProperties.abilityProperties.getOwnedActions().keys()]).toEqual([
    ...ownCombatant.combatantProperties.abilityProperties.getOwnedActions().keys(),
  ]);
  expect(viewOption.combatantWithPets.pets).toHaveLength(ownCharacterOption.pets.length);
  expect(viewOption.combatantWithPets.pets.length).toBeGreaterThan(0);

  expect(combatant.combatantProperties.inventory.getItemsCount()).toBe(0);
  for (const serializedPet of viewOption.combatantWithPets.pets) {
    const pet = Combatant.fromSerialized(serializedPet);
    expect(pet.combatantProperties.inventory.getItemsCount()).toBe(0);
  }

  await alpha.lobbyClientHarness.deleteSavedCharacter(ownCombatant.getEntityId());
  const missingOption = await ladderQueries.getProgressionCharacter(ownCombatant.getEntityId());
  expect(missingOption).toBeUndefined();
}

function equippedItemIds(combatant: Combatant) {
  return combatant.combatantProperties.equipment
    .getAllEquippedItems({ includeUnselectedHotswapSlots: true })
    .map((item) => item.getEntityId());
}

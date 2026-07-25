import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
} from "@/fixtures/consts";
import {
  CharacterControlScheme,
  CombatantClass,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  calculateTotalExperience,
  invariant,
} from "@speed-dungeon/common";

// Earns experience on a real progression character, then reads the ladder back the way a player
// does: a client in the lobby runs the query over the socket. Covers the whole path — battle victory
// writes the sorted set, the read pages it, hydrates each id from the saved character it actually
// belongs to, and resolves the owner's username.
export async function testProgressionCharacterExperiencePointsLadderReads(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();

  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      proceedToGameServer: true,
      characters: [{ name: TEST_CHARACTER_NAME_1, combatantClass: CombatantClass.Mage }],
    }
  );
  await alpha.gameClientHarness.toggleReadyToExplore();

  // nobody has earned anything yet, so the ladder is empty
  const ladderQueries = await testFixture.createLadderViewerQueries();
  const emptyPage = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  expect(emptyPage.entries).toHaveLength(0);
  expect(emptyPage.totalPages).toBe(0);

  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();

  const character = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
  const { classProgressionProperties } = character.combatantProperties;
  expect(classProgressionProperties.getMainClass().level).toBe(2);

  const page = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  expect(page.page).toBe(0);
  expect(page.totalPages).toBe(1);
  expect(page.entries).toHaveLength(1);

  const entry = page.entries[0];
  invariant(entry !== undefined, "expected the character that just leveled up");
  expect(entry.rank).toBe(1);
  expect(entry.characterId).toBe(character.getEntityId());
  expect(entry.characterName).toBe(TEST_CHARACTER_NAME_1);
  // the client sees the owner's name; the identity provider id it is stored under never leaves the server
  expect(entry.ownerUsername).toBe(TEST_AUTH_USERNAME_PLAYER_1);
  expect(entry.mainClass.combatantClass).toBe(CombatantClass.Mage);
  expect(entry.mainClass.level).toBe(2);
  // the level's own progress, next to the score every level ever earned adds up to
  expect(entry.mainClass.experiencePoints).toBe(
    classProgressionProperties.experiencePoints.getCurrent()
  );
  expect(entry.totalExperiencePoints).toBe(classProgressionProperties.totalExperiencePoints);
  expect(entry.totalExperiencePoints).toBe(
    calculateTotalExperience(2) + classProgressionProperties.experiencePoints.getCurrent()
  );
  expect(entry.supportClassOption).toBeUndefined();
}

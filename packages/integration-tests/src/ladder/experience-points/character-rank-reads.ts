import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  MISSING_RECORD_ID,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
} from "@/fixtures/consts";
import {
  CharacterControlScheme,
  CombatantClass,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  invariant,
} from "@speed-dungeon/common";

// "What rank am I?" — the question a board cannot answer for a player whose character is not on the
// page they are looking at. The lookup reads a position out of the sorted set rather than a page, so
// what has to hold is that it agrees with the rank the board itself shows.
export async function testExperiencePointsCharacterRankReads(testFixture: IntegrationTestFixture) {
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
  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();

  const characterId = alpha.clientApplication.combatantFocus.requireFocusedCharacter().getEntityId();
  const ladderQueries = await testFixture.createLadderViewerQueries();

  const page = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  const entry = page.entries[0];
  invariant(entry !== undefined, "expected the character that just earned experience");

  // asked about together, because a profile asks about every character its owner has at once. the
  // unranked id is simply absent rather than reported at some sentinel rank
  const ranksById = await ladderQueries.getExperiencePointsLadderRanks({
    controlScheme: CharacterControlScheme.Captain,
    characterIds: [characterId, MISSING_RECORD_ID],
  });

  // the sorted set counts positions from zero and every rank a client is shown counts from one
  expect(ranksById[characterId]).toBe(1);
  expect(ranksById[characterId]).toBe(entry.rank);
  expect(ranksById[MISSING_RECORD_ID]).toBeUndefined();

  // the other scheme is its own board, and this character is not on it
  const freelancerRanks = await ladderQueries.getExperiencePointsLadderRanks({
    controlScheme: CharacterControlScheme.Freelancer,
    characterIds: [characterId],
  });
  expect(freelancerRanks[characterId]).toBeUndefined();
}

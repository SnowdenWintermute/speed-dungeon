import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_2,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_GAME_NAME_2,
} from "@/fixtures/consts";
import {
  CharacterControlScheme,
  CombatantClass,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
} from "@speed-dungeon/common";

// Two players earn experience in the same way but under different control schemes. Each ladder must
// rank only its own scheme's characters — there is no combined ranking, and a Freelancer run can
// never push a Captain run down the board.
export async function testControlSchemeLaddersAreSeparate(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();

  const captain = await testFixture.createSingleClientInProgressionGame(
    "captain",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      proceedToGameServer: true,
      controlScheme: CharacterControlScheme.Captain,
      characters: [{ name: TEST_CHARACTER_NAME_1, combatantClass: CombatantClass.Mage }],
    }
  );
  const freelancer = await testFixture.createSingleClientInProgressionGame(
    "freelancer",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    {
      proceedToGameServer: true,
      controlScheme: CharacterControlScheme.Freelancer,
      gameName: TEST_GAME_NAME_2,
      characters: [{ name: TEST_CHARACTER_NAME_2, combatantClass: CombatantClass.Mage }],
    }
  );

  for (const client of [captain, freelancer]) {
    await client.gameClientHarness.toggleReadyToExplore();
    await client.gameClientHarness.useFireRankTwoOnAllEnemies();
  }

  const ladderQueries = await testFixture.createLadderViewerQueries();

  const captainPage = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  expect(captainPage.entries.map((entry) => entry.characterName)).toEqual([TEST_CHARACTER_NAME_1]);
  expect(captainPage.entries.map((entry) => entry.ownerUsername)).toEqual([
    TEST_AUTH_USERNAME_PLAYER_1,
  ]);
  expect(captainPage.entries.map((entry) => entry.rank)).toEqual([1]);

  const freelancerPage = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Freelancer,
    page: 0,
  });
  expect(freelancerPage.entries.map((entry) => entry.characterName)).toEqual([
    TEST_CHARACTER_NAME_2,
  ]);
  expect(freelancerPage.entries.map((entry) => entry.ownerUsername)).toEqual([
    TEST_AUTH_USERNAME_PLAYER_2,
  ]);
  // rank 1 on its own board, not rank 2 behind the captain character
  expect(freelancerPage.entries.map((entry) => entry.rank)).toEqual([1]);
}

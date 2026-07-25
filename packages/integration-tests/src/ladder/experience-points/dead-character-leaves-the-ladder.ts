import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_GAME_NAME_2,
} from "@/fixtures/consts";
import {
  CharacterControlScheme,
  CombatActionName,
  CombatantClass,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
} from "@speed-dungeon/common";

// A world ladder only ranks characters that are still alive, and the read has to reflect that the
// moment it happens: one of two ranked characters dies, and the survivor is left alone at rank 1.
export async function testDeadCharacterLeavesTheLadder(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();

  const doomed = await testFixture.createSingleClientInProgressionGame(
    "doomed",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      proceedToGameServer: true,
      characters: [{ name: TEST_CHARACTER_NAME_1, combatantClass: CombatantClass.Mage }],
    }
  );
  const survivor = await testFixture.createSingleClientInProgressionGame(
    "survivor",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    {
      proceedToGameServer: true,
      gameName: TEST_GAME_NAME_2,
      characters: [{ name: TEST_CHARACTER_NAME_2, combatantClass: CombatantClass.Mage }],
    }
  );

  for (const client of [doomed, survivor]) {
    await client.gameClientHarness.toggleReadyToExplore();
    await client.gameClientHarness.useFireRankTwoOnAllEnemies();
  }

  const ladderQueries = await testFixture.createLadderViewerQueries();
  const pageWithBoth = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  // both cleared the same room, so they are tied on score and the ladder decides the order between
  // them; what matters here is that both are ranked
  expect(pageWithBoth.entries.map((entry) => entry.characterName).sort()).toEqual([
    TEST_CHARACTER_NAME_1,
    TEST_CHARACTER_NAME_2,
  ]);
  expect(pageWithBoth.entries.map((entry) => entry.rank)).toEqual([1, 2]);

  // walk into the next lair on 1hp and decline to fight. (the Death action would be the deterministic
  // way to do this, but a player character does not own it — it exists for engine-triggered deaths)
  await doomed.gameClientHarness.toggleReadyToExplore();
  await doomed.gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  expect(doomed.clientApplication.gameContext.requireParty().hasWiped()).toBeTruthy();

  const pageAfterDeath = await ladderQueries.getExperiencePointsLadderPage({
    controlScheme: CharacterControlScheme.Captain,
    page: 0,
  });
  expect(pageAfterDeath.entries).toHaveLength(1);
  expect(pageAfterDeath.entries[0]?.characterName).toBe(TEST_CHARACTER_NAME_2);
  expect(pageAfterDeath.entries[0]?.rank).toBe(1);
}

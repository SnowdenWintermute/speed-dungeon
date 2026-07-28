import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
} from "@/fixtures/consts";
import {
  CharacterControlScheme,
  CombatantClass,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  Username,
  invariant,
} from "@speed-dungeon/common";

// The progression character tables on a player's profile: one per control scheme, because the two
// are separate ladders. Covers what a profile needs that the ladder page does not — a player's own
// characters listed without paging a board, and where each of them stands on the ladder it is on,
// including a character that is on none of them yet.
export async function testPlayerProgressionCharacterReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();

  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      proceedToGameServer: true,
      controlScheme: CharacterControlScheme.Captain,
      characters: [{ name: TEST_CHARACTER_NAME_1, combatantClass: CombatantClass.Mage }],
    }
  );

  // the ladder ranks experience points, and a battle victory is where that score gets written, so
  // this is what puts the character on it
  await alpha.gameClientHarness.toggleReadyToExplore();
  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();
  const rankedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();

  // back to the lobby to make a character on the other ladder, which has fought nothing
  await alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
  await alpha.lobbyClientHarness.createSavedCharacter(
    TEST_CHARACTER_NAME_2,
    CombatantClass.Warrior,
    CharacterControlScheme.Freelancer
  );

  // read as a guest: a profile is public, like every other ladder read
  const ladderQueries = await testFixture.createLadderViewerQueries();

  const captains = await ladderQueries.getPlayerProgressionCharacters({
    username: TEST_AUTH_USERNAME_PLAYER_1,
    controlScheme: CharacterControlScheme.Captain,
  });
  expect(captains.characters.map((character) => character.characterName)).toEqual([
    TEST_CHARACTER_NAME_1,
  ]);
  const captainCharacter = captains.characters[0];
  invariant(captainCharacter !== undefined, "expected alpha's captain character");
  expect(captainCharacter.ownerUsername).toBe(TEST_AUTH_USERNAME_PLAYER_1);
  expect(captainCharacter.totalExperiencePoints).toBeGreaterThan(0);
  // the only ranked character on that ladder, so it is at the top of it
  expect(captains.ranksByCharacterId[rankedCharacter.getEntityId()]).toBe(1);

  const freelancers = await ladderQueries.getPlayerProgressionCharacters({
    username: TEST_AUTH_USERNAME_PLAYER_1,
    controlScheme: CharacterControlScheme.Freelancer,
  });
  // each scheme lists only its own characters, as the boards do
  expect(freelancers.characters.map((character) => character.characterName)).toEqual([
    TEST_CHARACTER_NAME_2,
  ]);
  // it has earned no experience, so nothing ranks it — absent from the ranks rather than ranked last
  expect(freelancers.ranksByCharacterId).toEqual({});

  // a username belonging to nobody reads as a player with no characters. the profile query rendered
  // beside this one is what tells a reader they do not exist
  const noSuchPlayer = await ladderQueries.getPlayerProgressionCharacters({
    username: "not-a-player" as Username,
    controlScheme: CharacterControlScheme.Captain,
  });
  expect(noSuchPlayer.characters).toHaveLength(0);
  expect(noSuchPlayer.ranksByCharacterId).toEqual({});
}

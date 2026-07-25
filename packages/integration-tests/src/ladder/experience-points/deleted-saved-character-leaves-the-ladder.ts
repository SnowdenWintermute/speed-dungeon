import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { LOW_HP_CHARACTER_FIXTURES, TEST_DUNGEON_FOUR_ONE_HP_WOLVES } from "@speed-dungeon/common";
import { CAPTAIN_LADDER_NAME } from "./consts";

// on saved character delete, removes entry from ladder
export async function testDeletedSavedCharacterLeavesTheLadder(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  // alpha join a game and gain some experience points
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { proceedToGameServer: true }
  );
  await alpha.gameClientHarness.toggleReadyToExplore();
  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();
  const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();
  const expectedRankAfter = await testFixture.rankedLadderService.getCurrentRank(
    CAPTAIN_LADDER_NAME,
    characterId
  );
  expect(expectedRankAfter).toBe(0);
  await alpha.gameClientHarness.leaveGame();
  await alpha.clientApplication.gameClientRef.get().close();
  await alpha.connect();
  await alpha.lobbyClientHarness.deleteSavedCharacter(characterId);

  const expectedRankAfterDelete = await testFixture.rankedLadderService.getCurrentRank(
    CAPTAIN_LADDER_NAME,
    characterId
  );
  expect(expectedRankAfterDelete).toBeNull();
}

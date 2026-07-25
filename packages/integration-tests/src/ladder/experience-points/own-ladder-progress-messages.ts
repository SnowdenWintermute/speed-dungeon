import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatActionName,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
} from "@speed-dungeon/common";
import { CAPTAIN_LADDER_NAME } from "./consts";
import {
  gotLadderDeathMessage,
  gotLadderExperienceMessage,
  gotLadderLevelUpMessage,
} from "./ladder-message-assertions";

export async function testOwnLadderRankUpMessages(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  // alpha join a game and gain some experience points
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { proceedToGameServer: true }
  );
  await alpha.gameClientHarness.toggleReadyToExplore();

  // pre rank up assertions
  const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
  expect(focusedCharacter.getLevel()).toBe(1);
  const expectedRankBefore = await testFixture.rankedLadderService.getCurrentRank(
    CAPTAIN_LADDER_NAME,
    focusedCharacter.getEntityId()
  );
  expect(expectedRankBefore).toBeNull();

  // kill all enemy targets and expect to level/rank up
  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();

  // post rank up assertions
  const alphaUsername = alpha.clientApplication.session.requireUsername();
  expect(focusedCharacter.getLevel()).toBe(2);
  gotLadderLevelUpMessage(alpha.clientApplication, alphaUsername, focusedCharacter);
  gotLadderExperienceMessage(alpha.clientApplication, alphaUsername, focusedCharacter);
  const expectedRankAfter = await testFixture.rankedLadderService.getCurrentRank(
    CAPTAIN_LADDER_NAME,
    focusedCharacter.getEntityId()
  );
  expect(expectedRankAfter).toBe(0);
}

export async function testOwnLadderDeathMessages(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "alpha",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    { proceedToGameServer: true }
  );
  await alpha.gameClientHarness.toggleReadyToExplore();

  const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
  // kill all enemy targets and expect to level/rank up
  await alpha.gameClientHarness.useFireRankTwoOnAllEnemies();
  const alphaUsername = alpha.clientApplication.session.requireUsername();
  // character die
  await alpha.gameClientHarness.toggleReadyToExplore();
  await alpha.gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  expect(alpha.clientApplication.gameContext.requireParty().hasWiped()).toBeTruthy();
  // got own death message
  gotLadderDeathMessage(alpha.clientApplication, alphaUsername, focusedCharacter);
  // no longer in rankings
  const expectedRankAfterDeath = await testFixture.rankedLadderService.getCurrentRank(
    CAPTAIN_LADDER_NAME,
    focusedCharacter.getEntityId()
  );
  expect(expectedRankAfterDeath).toBe(null);
}

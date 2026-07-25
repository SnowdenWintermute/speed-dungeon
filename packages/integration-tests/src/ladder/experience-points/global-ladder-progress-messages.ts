import {
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_SESSION_ID_PLAYER_3,
  TEST_GAME_NAME_2,
  TEST_GAME_NAME_3,
  TEST_GAME_SERVER_NAME_STRINGS,
  TestGameServerName,
} from "@/fixtures/consts";
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

// on ladder rank up, all players on all connected servers see the message
export async function testGlobalLadderRankUpMessages(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  // have a separate client in another game on another server so they can see if they see a global ladder message
  const bravo = await testFixture.createSingleClientInProgressionGame(
    "bravo",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    { gameName: TEST_GAME_NAME_2, proceedToGameServer: true }
  );

  // next two clients will make separate games on another server
  testFixture.setLeastBusyGameServerGetter(async () => {
    return {
      name: TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Alexandria],
      url: localServerUrl(testFixture.getGameServerPort(TestGameServerName.Alexandria)),
    };
  });
  // a user to make a game on same server to see message
  const charlie = await testFixture.createSingleClientInProgressionGame(
    "charlie",
    TEST_AUTH_SESSION_ID_PLAYER_3,
    { gameName: TEST_GAME_NAME_3, proceedToGameServer: true }
  );
  // alpha join a game and gain some experience points
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

  // bravo (user on different game server) got message
  await bravo.eventually(() => {
    gotLadderLevelUpMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
    gotLadderExperienceMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
  });

  // charlie (user on same server) got message
  await charlie.eventually(() => {
    gotLadderLevelUpMessage(charlie.clientApplication, alphaUsername, focusedCharacter);
    gotLadderExperienceMessage(charlie.clientApplication, alphaUsername, focusedCharacter);
  });

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
  // bravo got message
  await bravo.eventually(() => {
    gotLadderDeathMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
  });
}

// on ladder death, all players on all connected servers see the message
export async function testGlobalLadderDeathMessages(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES, LOW_HP_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  // have a separate client in another game so they can see if they see a global ladder message
  const bravo = await testFixture.createSingleClientInProgressionGame(
    "bravo",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    { gameName: TEST_GAME_NAME_2, proceedToGameServer: true }
  );

  // alpha join a game and gain some experience points
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
  // bravo got message
  await bravo.eventually(() => {
    gotLadderDeathMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
  });
}

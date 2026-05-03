import { GameLogMessageStyle } from "@/client-application/event-log/game-log-messages";
import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_CHARACTER_NAME_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CHARACTER_LEVEL_LADDER,
  CombatActionName,
  NextOrPrevious,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
} from "@speed-dungeon/common";

describe("progression game", () => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  // client sees own rank up message
  it("ladder rank up message on own client", async () => {
    await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES);
    testFixture.timeMachine.start();
    const alpha = await testFixture.createSingleClientInLobbyProgressionGame(
      "alpha",
      TEST_AUTH_SESSION_ID_PLAYER_1
    );
    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    await alpha.clientApplication.transitionToGameServer.waitFor();
    await alpha.gameClientHarness.toggleReadyToExplore();
    await alpha.gameClientHarness.selectCombatAction(CombatActionName.Fire, 2);
    await alpha.gameClientHarness.cycleTargetingSchemes();
    await alpha.gameClientHarness.cycleTargets(NextOrPrevious.Next);
    const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
    expect(focusedCharacter.getLevel()).toBe(1);

    const expectedRankBefore = await testFixture.rankedLadderService.getCurrentRank(
      CHARACTER_LEVEL_LADDER,
      focusedCharacter.getEntityId()
    );
    expect(expectedRankBefore).toBeNull();

    await alpha.gameClientHarness.useSelectedCombatAction();
    expect(focusedCharacter.getLevel()).toBe(2);
    const expectedLadderLevelupMessage = alpha.clientApplication.eventLogStore.getMessages().at(-2);
    expect(expectedLadderLevelupMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
    expect(expectedLadderLevelupMessage?.message?.toString()).toBe(
      createLevelLadderLevelupMessage(
        TEST_CHARACTER_NAME_1,
        alpha.clientApplication.session.requireUsername(),
        focusedCharacter.getLevel(),
        0
      )
    );
    const expectedLadderExperienceGainMessage = alpha.clientApplication.eventLogStore
      .getMessages()
      .at(-1);
    expect(expectedLadderExperienceGainMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
    expect(expectedLadderExperienceGainMessage?.message?.toString()).toBe(
      createLevelLadderExpRankMessage(
        TEST_CHARACTER_NAME_1,
        alpha.clientApplication.session.requireUsername(),
        focusedCharacter.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
        0
      )
    );

    const expectedRankAfter = await testFixture.rankedLadderService.getCurrentRank(
      CHARACTER_LEVEL_LADDER,
      focusedCharacter.getEntityId()
    );
    expect(expectedRankAfter).toBe(0);
  });

  // on ladder death, other players see death message
  // it("ladder death message", async () => {
  //   // two clients each in their own progression game
  //   // alpha client is playing with a ranked character in the top 10
  //   // alpha party wipes
  //   // alpha and bravo client see ladder death message
  // });

  // on ladder rank up, all players on all connected servers see message
  // it("global ladder messages", async()=>{
  // two clients each in their own progression game on separate servers
  // alpha client battle victory
  // alpha and bravo client see message
  //
  // })
  //
  // // on saved character delete, removes entry from ladder
  // it("saved character deleted ladder removal", async () => {
  // });
  //
  // // on ladder death/rank change, ladder page request shows correct rankings
  // it("ladder page ranks", async () => {
  //   // fetch page before rank
  //   // client gains ladder rank
  //   // fetch page shows rank
  //   // client wipes
  //   // fetch page shows no rank
  // });
});

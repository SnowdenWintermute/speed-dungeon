import { ClientApplication } from "@/client-application";
import { GameLogMessageStyle } from "@/client-application/event-log/game-log-messages";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME_2,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CHARACTER_LEVEL_LADDER,
  CombatActionName,
  Combatant,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_FOUR_ONE_HP_WOLVES,
  Username,
  createLadderDeathsMessage,
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
  it("own ladder rank up messages", async () => {
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
      CHARACTER_LEVEL_LADDER,
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
      CHARACTER_LEVEL_LADDER,
      focusedCharacter.getEntityId()
    );
    expect(expectedRankAfter).toBe(0);
  });

  it("own ladder death messages", async () => {
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
    expect(alpha.clientApplication.gameContext.requireParty().timeOfWipe).toBeDefined();
    // got own death message
    gotLadderDeathMessage(alpha.clientApplication, alphaUsername, focusedCharacter);
    // no longer in rankings
    const expectedRankAfterDeath = await testFixture.rankedLadderService.getCurrentRank(
      CHARACTER_LEVEL_LADDER,
      focusedCharacter.getEntityId()
    );
    expect(expectedRankAfterDeath).toBe(null);
  });

  // on ladder rank up, all players on all connected servers see message
  it("global ladder rank up messages", async () => {
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

    // bravo got message
    await bravo.eventually(() => {
      console.log(bravo.clientApplication.eventLogStore.getMessages());
      gotLadderLevelUpMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
      gotLadderExperienceMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
    });
    console.log(bravo.clientApplication.eventLogStore.getMessages());

    // character die
    await alpha.gameClientHarness.toggleReadyToExplore();
    await alpha.gameClientHarness.useCombatAction(CombatActionName.PassTurn);
    expect(alpha.clientApplication.gameContext.requireParty().timeOfWipe).toBeDefined();
    // got own death message
    gotLadderDeathMessage(alpha.clientApplication, alphaUsername, focusedCharacter);
    // no longer in rankings
    const expectedRankAfterDeath = await testFixture.rankedLadderService.getCurrentRank(
      CHARACTER_LEVEL_LADDER,
      focusedCharacter.getEntityId()
    );
    expect(expectedRankAfterDeath).toBe(null);
    // bravo got message
    await bravo.eventually(() => {
      console.log(bravo.clientApplication.eventLogStore.getMessages());
      gotLadderDeathMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
    });
  });

  // on ladder death, all players on all connected servers see message
  it("global ladder death messages", async () => {
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
    expect(alpha.clientApplication.gameContext.requireParty().timeOfWipe).toBeDefined();
    // bravo got message
    await bravo.eventually(() => {
      console.log(bravo.clientApplication.eventLogStore.getMessages());
      gotLadderDeathMessage(bravo.clientApplication, alphaUsername, focusedCharacter);
    });
  });

  // // on saved character delete, removes entry from ladder
  it("saved character deleted ladder removal", async () => {
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
      CHARACTER_LEVEL_LADDER,
      characterId
    );
    expect(expectedRankAfter).toBe(0);
    await alpha.gameClientHarness.leaveGame();
    await alpha.clientApplication.gameClientRef.get().close();
    await alpha.connect();
    await alpha.lobbyClientHarness.deleteSavedCharacter(characterId);

    const expectedRankAfterDelete = await testFixture.rankedLadderService.getCurrentRank(
      CHARACTER_LEVEL_LADDER,
      characterId
    );
    expect(expectedRankAfterDelete).toBeNull();
  });
});

function gotLadderLevelUpMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedLadderLevelupMessage = clientApplication.eventLogStore.getMessages().at(-2);
  expect(expectedLadderLevelupMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedLadderLevelupMessage?.message?.toString()).toBe(
    createLevelLadderLevelupMessage(
      character.entityProperties.name,
      ownerUsername,
      character.getLevel(),
      0
    )
  );
}

function gotLadderExperienceMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedLadderExperienceGainMessage = clientApplication.eventLogStore.getMessages().at(-1);
  expect(expectedLadderExperienceGainMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedLadderExperienceGainMessage?.message?.toString()).toBe(
    createLevelLadderExpRankMessage(
      character.entityProperties.name,
      ownerUsername,
      character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
      0
    )
  );
}

function gotLadderDeathMessage(
  clientApplication: ClientApplication,
  ownerUsername: Username,
  character: Combatant
) {
  const expectedMessage = clientApplication.eventLogStore.getMessages().at(-1);
  expect(expectedMessage?.style).toBe(GameLogMessageStyle.LadderProgress);
  expect(expectedMessage?.message?.toString()).toBe(
    createLadderDeathsMessage(
      character.entityProperties.name,
      ownerUsername,
      character.getLevel(),
      0
    )
  );
}

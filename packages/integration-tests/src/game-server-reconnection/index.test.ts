import { TEST_GAME_NAME, TEST_PARTY_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatantClass,
  CombatAttribute,
  DungeonRoomType,
  ERROR_MESSAGES,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

describe("game server reconnection", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });
  // auth and guest versions needed:
  it("reconnection success", async () => {
    testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);

    const alpha = testFixture.createClient("client a");
    const bravo = testFixture.createClient("client b");
    await Promise.all([alpha.connect(), bravo.connect()]);

    await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME);
    await alpha.lobbyClientHarness.createParty(TEST_PARTY_NAME);
    await alpha.lobbyClientHarness.createCharacter("a", CombatantClass.Rogue);

    await bravo.lobbyClientHarness.fetchGameList();
    const gameInList = bravo.clientApplication.lobbyContext.gameList[0];
    invariant(gameInList !== undefined);
    expect(gameInList.gameName).toBe(TEST_GAME_NAME);

    await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
    await bravo.lobbyClientHarness.joinParty(TEST_PARTY_NAME);
    await bravo.lobbyClientHarness.createCharacter("b", CombatantClass.Warrior);

    await alpha.eventually(() => {
      const partyOption = alpha.clientApplication.gameContext.partyOption;
      expect(
        partyOption?.combatantManager
          .getPartyMemberCharacters()
          .find((character) => character.getName() === "b")
      ).toBeDefined();
    });

    const alphaReadiedUpPromise = alpha.lobbyClientHarness.toggleReadyToStartGame();
    const bravoReadiedUpPromise = bravo.lobbyClientHarness.toggleReadyToStartGame();
    bravo.lobbyClientHarness.pauseTransport();

    await alphaReadiedUpPromise;

    await alpha.clientApplication.transitionToGameServer.waitFor();

    // here we would want to test for trying to input before 2nd player joined
    await alpha.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
    console.log(
      "error expected:",
      alpha.clientApplication.errorRecordService.getLastError()?.message
    );

    bravo.lobbyClientHarness.resumeTransport();
    await bravoReadiedUpPromise;
    await bravo.clientApplication.transitionToGameServer.waitFor();

    // expect(
    //   alpha.gameClientHarness.clientApplication.gameContext.requireGame().requireTimeStarted()
    // );
    // expect(
    //   bravo.gameClientHarness.clientApplication.gameContext.requireGame().requireTimeStarted()
    // );

    const partyA = alpha.gameClientHarness.clientApplication.gameContext.requireParty();
    const partyB = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
    await alpha.gameClientHarness.toggleReadyToExplore();
    expect(partyA.currentRoom.requireType(DungeonRoomType.Empty));
    await bravo.gameClientHarness.toggleReadyToExplore();
    expect(partyB.currentRoom.requireType(DungeonRoomType.MonsterLair));

    // now try disconnect/reconnect
    await alpha.clientApplication.gameClientRef.get().close();

    await bravo.eventually(() => {
      const partyOption = bravo.clientApplication.gameContext.partyOption;
      invariant(partyOption !== undefined);
      expect(partyOption.playerUsernamesAwaitingReconnection.size > 0).toBeTruthy();
    });
    // b can not enter inputs while a has disconnected
    bravo.clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
    await bravo.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
    expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.GAME.INPUT_IS_LOCKED
    );
    // a reconnect
    await alpha.connect();
    await bravo.eventually(() => {
      const partyOption = bravo.clientApplication.gameContext.partyOption;
      invariant(partyOption !== undefined);
      expect(partyOption.playerUsernamesAwaitingReconnection.size === 0).toBeTruthy();
    });
    // inputs are now accepted
    bravo.clientApplication.errorRecordService.clear();
    await bravo.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
    expect(bravo.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  });
});

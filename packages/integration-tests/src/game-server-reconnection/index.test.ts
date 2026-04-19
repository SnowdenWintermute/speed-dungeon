import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_GAME_NAME, TEST_PARTY_NAME } from "@/servers/fixtures";
import { websocketFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import {
  AbilityType,
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantClass,
  CombatAttribute,
  DungeonRoomType,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

describe("game server reconnection", () => {
  const testFixture = new IntegrationTestFixture(websocketFactory);

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });
  // auth and guest versions needed:
  it("reconnection success", async () => {
    testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);

    const a = testFixture.createClient("client a");
    const b = testFixture.createClient("client b");
    await Promise.all([a.connect(), b.connect()]);

    await a.lobbyClientHarness.createGame(TEST_GAME_NAME);
    await a.lobbyClientHarness.createParty(TEST_PARTY_NAME);
    await a.lobbyClientHarness.createCharacter("a", CombatantClass.Rogue);

    await b.lobbyClientHarness.fetchGameList();
    const gameInList = b.clientApplication.lobbyContext.gameList[0];
    invariant(gameInList !== undefined);
    expect(gameInList.gameName).toBe(TEST_GAME_NAME);

    await b.lobbyClientHarness.joinGame(TEST_GAME_NAME);
    await b.lobbyClientHarness.joinParty(TEST_PARTY_NAME);
    await b.lobbyClientHarness.createCharacter("b", CombatantClass.Warrior);

    await a.eventually(() => {
      const partyOption = a.clientApplication.gameContext.partyOption;
      expect(
        partyOption?.combatantManager
          .getPartyMemberCharacters()
          .find((character) => character.getName() === "b")
      ).toBeDefined();
    });

    await Promise.all([
      a.lobbyClientHarness.toggleReadyToStartGame(),
      b.lobbyClientHarness.toggleReadyToStartGame(),
    ]);

    await a.clientApplication.sequentialEventProcessor.waitUntilIdle();
    await a.clientApplication.transitionToGameServer.waitFor();
    await b.clientApplication.sequentialEventProcessor.waitUntilIdle();
    await b.clientApplication.transitionToGameServer.waitFor();

    expect(a.gameClientHarness.clientApplication.gameContext.requireGame().requireTimeStarted());
    expect(b.gameClientHarness.clientApplication.gameContext.requireGame().requireTimeStarted());

    const partyA = a.gameClientHarness.clientApplication.gameContext.requireParty();
    const partyB = b.gameClientHarness.clientApplication.gameContext.requireParty();
    await a.gameClientHarness.toggleReadyToExplore();
    expect(partyA.currentRoom.requireType(DungeonRoomType.Empty));
    await b.gameClientHarness.toggleReadyToExplore();
    expect(partyB.currentRoom.requireType(DungeonRoomType.MonsterLair));

    // now try disconnect/reconnect
    await a.clientApplication.gameClientRef.get().close();

    await b.eventually(() => {
      console.log("checking");
      const partyOption = b.clientApplication.gameContext.partyOption;
      invariant(partyOption !== undefined);
      expect(partyOption.playerUsernamesAwaitingReconnection.size > 0).toBeTruthy();
    });
    // b can not enter inputs while a has disconnected
    b.clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
    await b.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
    console.log(b.clientApplication.errorRecordService.getLastError());
    expect(b.clientApplication.errorRecordService.getLastError());
  });
});

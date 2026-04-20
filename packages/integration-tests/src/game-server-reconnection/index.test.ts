import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
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

  it("reconnection token reuse", async () => {
    testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
    const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();
    const tokenToAttemptReuse =
      alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken;

    // now try disconnect/reconnect
    await alpha.clientApplication.gameClientRef.get().close();
    invariant(tokenToAttemptReuse !== null, "expected to have a guestGameReconnectionToken");
    // a reconnect
    await alpha.connect();
    alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken = tokenToAttemptReuse;
    await alpha.clientApplication.gameClientRef.get().close();
    console.log("reusing token:", tokenToAttemptReuse);
    try {
      await alpha.connect();
    } catch (err) {
      console.log("error connecting", err);
    }
  });

  // // auth and guest versions needed:
  // it("reconnection success", async () => {
  //   testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);

  //   const { alpha, bravo } = await testFixture.createTwoClientsInLobbyGame();

  //   const alphaReadiedUpPromise = alpha.lobbyClientHarness.toggleReadyToStartGame();
  //   const bravoReadiedUpPromise = bravo.lobbyClientHarness.toggleReadyToStartGame();
  //   bravo.lobbyClientHarness.pauseTransport();

  //   await alphaReadiedUpPromise;
  //   await alpha.clientApplication.transitionToGameServer.waitFor();

  //   await alpha.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  //   expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
  //     ERROR_MESSAGES.GAME.NOT_STARTED
  //   );

  //   bravo.lobbyClientHarness.resumeTransport();
  //   await bravoReadiedUpPromise;
  //   await bravo.clientApplication.transitionToGameServer.waitFor();

  //   const partyA = alpha.gameClientHarness.clientApplication.gameContext.requireParty();
  //   const partyB = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
  //   await alpha.gameClientHarness.toggleReadyToExplore();
  //   expect(partyA.currentRoom.requireType(DungeonRoomType.Empty));
  //   await bravo.gameClientHarness.toggleReadyToExplore();
  //   expect(partyB.currentRoom.requireType(DungeonRoomType.MonsterLair));

  //   // now try disconnect/reconnect
  //   await alpha.clientApplication.gameClientRef.get().close();

  //   await bravo.eventually(() => {
  //     const partyOption = bravo.clientApplication.gameContext.partyOption;
  //     invariant(partyOption !== undefined);
  //     expect(partyOption.playerUsernamesAwaitingReconnection.size > 0).toBeTruthy();
  //   });
  //   // b can not enter inputs while a has disconnected
  //   bravo.clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  //   await bravo.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  //   expect(bravo.clientApplication.errorRecordService.getLastError()?.message).toBe(
  //     ERROR_MESSAGES.GAME.INPUT_IS_LOCKED
  //   );
  //   // a reconnect
  //   await alpha.connect();
  //   await bravo.eventually(() => {
  //     const partyOption = bravo.clientApplication.gameContext.partyOption;
  //     invariant(partyOption !== undefined);
  //     expect(partyOption.playerUsernamesAwaitingReconnection.size === 0).toBeTruthy();
  //   });
  //   // inputs are now accepted
  //   bravo.clientApplication.errorRecordService.clear();
  //   await bravo.gameClientHarness.allocateAttributePoint(CombatAttribute.Strength);
  //   expect(bravo.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  // });
});

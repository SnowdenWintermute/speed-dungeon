import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatantClass,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";

describe("saved characters", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("delete saved characters", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    for (let slotIndex = 0; slotIndex < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; slotIndex += 1) {
      await alpha.lobbyClientHarness.createSavedCharacter(
        "character name",
        CombatantClass.Warrior,
        slotIndex
      );
    }
    // delete the character
    const characterInFirstSlot =
      alpha.clientApplication.lobbyContext.savedCharacters.requireFilledSlot(0);
    await alpha.lobbyClientHarness.deleteSavedCharacter(
      characterInFirstSlot.combatant.getEntityId()
    );
    // can create in that slot now
    expect(alpha.clientApplication.lobbyContext.savedCharacters.slots[0]).toBeNull();
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      0
    );
    expect(alpha.clientApplication.errorRecordService.count).toBe(0);
  });

  it("slot filled", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      0
    );
    expect(alpha.clientApplication.errorRecordService.count).toBe(0);
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      0
    );
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL
    );
  });

  it("create saved characters to capacity", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    for (let slotIndex = 0; slotIndex < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; slotIndex += 1) {
      await alpha.lobbyClientHarness.createSavedCharacter(
        "character name",
        CombatantClass.Warrior,
        slotIndex
      );
    }
    expect(alpha.clientApplication.errorRecordService.count).toBe(0);
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      DEFAULT_ACCOUNT_CHARACTER_CAPACITY
    );
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND
    );
  });

  it("only auth users can create saved characters", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1");
    await alpha.connect();
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      0
    );
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.AUTH.REQUIRED
    );
  });

  it("can not delete saved character while session in a game", async () => {
    await testFixture.resetWithOptions();
    testFixture.timeMachine.start();
    // alpha join a game and gain some experience points
    const alpha = await testFixture.createSingleClientInProgressionGame(
      "alpha",
      TEST_AUTH_SESSION_ID_PLAYER_1
    );
    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    await alpha.clientApplication.transitionToGameServer.waitFor();
    const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();

    const alphaOtherTab = testFixture.createClient(
      "alpha other tab",
      TEST_AUTH_SESSION_ID_PLAYER_1
    );
    await alphaOtherTab.connect();

    await alphaOtherTab.lobbyClientHarness.deleteSavedCharacter(focusedCharacter.getEntityId());
    expect(alphaOtherTab.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.USER.CANT_DELETE_SAVED_CHARACTER_WHILE_IN_GAME
    );
  });
});

import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";

describe("progression game", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("auth user with saved character", async () => {
    testFixture.resetWithOptions();
    // connect as guest
    const client = testFixture.createClient("client 1");
    await client.connect();
    // try create progression game
    await client.lobbyClientHarness.createGame("test-game-a", GameMode.Progression);
    // get "auth required" error
    expect(client.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.AUTH.REQUIRED
    );
    client.clientApplication.errorRecordService.clear();
    // become auth
    await client.reconnectAsAuth(TEST_AUTH_SESSION_ID_PLAYER_1);
    // try create progression game
    await client.lobbyClientHarness.createGame("test-game-a", GameMode.Progression);
    // get "saved character required" error
    expect(client.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS
    );
    client.clientApplication.errorRecordService.clear();
    // create saved character
    await client.lobbyClientHarness.createSavedCharacter("character 1", CombatantClass.Warrior, 0);
    // create progression game
    await client.lobbyClientHarness.createGame("test-game-a", GameMode.Progression);
    expect(client.clientApplication.errorRecordService.count).toBe(0);
    // get full game update
    expect(client.clientApplication.gameContext.partyOption).toBeDefined();
  });
});

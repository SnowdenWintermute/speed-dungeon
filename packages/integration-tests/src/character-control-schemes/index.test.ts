import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_CHARACTER_NAME_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatantClass,
  ERROR_MESSAGES,
  GameMode,
} from "@speed-dungeon/common";

describe("character control schemes", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("freelancer fresh run rejects second character creation", async () => {
    await testFixture.resetWithOptions();
    // create fresh freelancer ironman
    const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    await alpha.lobbyClientHarness.createGame(
      TEST_GAME_NAME,
      GameMode.Ironman,
      CharacterControlScheme.Freelancer
    );
    // alpha creates one character → ok
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
    // alpha tries to create a second → error
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.PLAYER.PARTY_CHARACTER_LIMIT
    );
  });

  it("captains fresh run allows multiple characters", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    await alpha.lobbyClientHarness.createGame(
      TEST_GAME_NAME,
      GameMode.Ironman,
      CharacterControlScheme.Captain
    );

    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_2, CombatantClass.Warrior);
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.GAME.MAX_PARTY_SIZE
    );
  });
});

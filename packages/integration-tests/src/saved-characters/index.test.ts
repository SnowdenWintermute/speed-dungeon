import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatantClass,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  ERROR_MESSAGES,
  invariant,
} from "@speed-dungeon/common";

describe("saved characters", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("delete saved character then create another", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    for (let i = 0; i < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; i += 1) {
      await alpha.lobbyClientHarness.createSavedCharacter(
        `character ${i}`,
        CombatantClass.Warrior,
        CharacterControlScheme.Captain
      );
    }
    const captainCharacters =
      alpha.clientApplication.lobbyContext.savedCharacters.byControlScheme[
        CharacterControlScheme.Captain
      ];
    expect(captainCharacters.length).toBe(DEFAULT_ACCOUNT_CHARACTER_CAPACITY);

    const firstCharacter = captainCharacters[0];
    invariant(firstCharacter !== undefined, "expected at least one saved character");
    await alpha.lobbyClientHarness.deleteSavedCharacter(firstCharacter.combatant.getEntityId());

    expect(captainCharacters.length).toBe(DEFAULT_ACCOUNT_CHARACTER_CAPACITY - 1);

    await alpha.lobbyClientHarness.createSavedCharacter(
      "replacement",
      CombatantClass.Warrior,
      CharacterControlScheme.Captain
    );
    expect(alpha.clientApplication.errorRecordService.count).toBe(0);
    expect(captainCharacters.length).toBe(DEFAULT_ACCOUNT_CHARACTER_CAPACITY);
  });

  it("create saved characters to capacity then fail to create more", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    for (let i = 0; i < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; i += 1) {
      await alpha.lobbyClientHarness.createSavedCharacter(
        `character ${i}`,
        CombatantClass.Warrior,
        CharacterControlScheme.Captain
      );
    }
    expect(alpha.clientApplication.errorRecordService.count).toBe(0);
    await alpha.lobbyClientHarness.createSavedCharacter(
      "one too many",
      CombatantClass.Warrior,
      CharacterControlScheme.Captain
    );
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.USER.CHARACTER_CAPACITY_REACHED
    );
  });

  it("only auth users can create saved characters", async () => {
    await testFixture.resetWithOptions();
    const alpha = testFixture.createClient("client 1");
    await alpha.connect();
    await alpha.lobbyClientHarness.createSavedCharacter(
      "character name",
      CombatantClass.Warrior,
      CharacterControlScheme.Captain
    );
    expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
      ERROR_MESSAGES.AUTH.REQUIRED
    );
  });
});

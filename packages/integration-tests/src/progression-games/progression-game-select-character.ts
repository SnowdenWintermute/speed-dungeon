import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED,
  CombatantClass,
  ERROR_MESSAGES,
  GameStateUpdateType,
} from "@speed-dungeon/common";

export async function testProgressionGameSelectCharacter(testFixture: IntegrationTestFixture) {
  testFixture.resetWithOptions(undefined, BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED);
  const alpha = await testFixture.createSingleClientInLobbyProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1,
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior, slotIndex: 0 },
        {
          name: "deeper floor character",
          combatantClass: CombatantClass.Warrior,
          slotIndex: 1,
        },
      ],
    }
  );
  const alphaPlayerContext = alpha.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );

  const { savedCharacters: alphaSavedCharacters } = alpha.clientApplication.lobbyContext;
  const alphaFirstCharacter = alphaSavedCharacters.requireFilledSlot(0);
  expect(alphaPlayerContext.player.characterIds).toStrictEqual([
    alphaFirstCharacter.combatant.getEntityId(),
  ]);

  const bravo = await testFixture.createSingleClientWithSavedCharacters(
    "client 2",
    TEST_AUTH_SESSION_ID_PLAYER_2,
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior, slotIndex: 0 },
        {
          name: "deeper floor character",
          combatantClass: CombatantClass.Warrior,
          slotIndex: 1,
        },
      ],
    }
  );
  await bravo.lobbyClientHarness.joinGame(TEST_GAME_NAME);
  await alpha.lobbyClientHarness.awaitMessageOfType(GameStateUpdateType.CharacterAddedToParty);

  // first user sees second user's character when they join
  const { savedCharacters: bravoSavedCharacters } = bravo.clientApplication.lobbyContext;
  const bravoPlayerContextAsAlpha = alpha.clientApplication.gameContext.requirePlayerContext(
    bravo.clientApplication.session.requireUsername()
  );
  const bravoFirstCharacter = bravoSavedCharacters.requireFilledSlot(0);
  const alphaViewOfBravoPlayer = bravoPlayerContextAsAlpha.game.players.get(
    bravoPlayerContextAsAlpha.player.username
  );
  expect(alphaViewOfBravoPlayer?.characterIds).toStrictEqual([
    bravoFirstCharacter.combatant.getEntityId(),
  ]);

  // other user sees newly selected character
  const alphaPlayerContextAsBravo = bravo.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );
  const bravoViewOfAlphaPlayer = alphaPlayerContextAsBravo.game.players.get(
    alphaPlayerContextAsBravo.player.username
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaFirstCharacter.combatant.getEntityId(),
  ]);

  // can not select a floor higher than max reached by any selected character
  const initialMaxFloor = alpha.clientApplication.gameContext.requireGame().maxStartingFloor;
  expect(initialMaxFloor).toBe(1);
  await alpha.lobbyClientHarness.selectProgressionGameStartingFloor(2);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT
  );
  expect(alphaPlayerContext.game.selectedStartingFloor).toBe(1);

  // select second character with a greater starting floor
  const alphaSecondCharacter = alphaSavedCharacters.requireFilledSlot(1);
  await alpha.lobbyClientHarness.selectSavedCharacterInProgressionGame(
    alphaSecondCharacter.combatant.getEntityId()
  );
  // selecting player sees newly selected character
  expect(alphaPlayerContext.player.characterIds).toStrictEqual([
    alphaSecondCharacter.combatant.getEntityId(),
  ]);
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
  );
  // other player sees selection
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaSecondCharacter.combatant.getEntityId(),
  ]);

  // can not yet select higher floor number (bravo's character has only been to floor 1)
  expect(alphaSecondCharacter.combatant.combatantProperties.deepestFloorReached).toBeGreaterThan(
    initialMaxFloor
  );
  let newMaxFloor = alphaPlayerContext.game.maxStartingFloor;
  expect(newMaxFloor).toBe(1);

  await alpha.lobbyClientHarness.selectProgressionGameStartingFloor(2);
  expect(alpha.clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.GAME.STARTING_FLOOR_LIMIT
  );
  expect(alphaPlayerContext.game.selectedStartingFloor).toBe(1);
  // bravo select second character with a greater starting floor
  const bravoSecondCharacter = bravoSavedCharacters.requireFilledSlot(1);
  const alphaSawCharacterSelectedPromise = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
  );
  await bravo.lobbyClientHarness.selectSavedCharacterInProgressionGame(
    bravoSecondCharacter.combatant.getEntityId()
  );

  // alpha sees new max floor has risen
  await alphaSawCharacterSelectedPromise;
  newMaxFloor = alphaPlayerContext.game.maxStartingFloor;
  expect(newMaxFloor).toBe(4);

  // can select new max floor
  // selecting lower floor reached character sets selected floor back to lower number
}

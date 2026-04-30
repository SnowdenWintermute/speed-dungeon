import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED,
  CombatantClass,
  ERROR_MESSAGES,
  GameStateUpdateType,
} from "@speed-dungeon/common";

export async function testProgressionGameStartingFloorSelection(
  testFixture: IntegrationTestFixture
) {
  testFixture.resetWithOptions(undefined, BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED);
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior, slotIndex: 0 },
        {
          name: "deeper floor character",
          combatantClass: CombatantClass.Warrior,
          slotIndex: 1,
        },
      ],
    },
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
  const bravoSawAlphaSelectDeeperFloorCharacterPromise =
    bravo.lobbyClientHarness.awaitMessageOfType(
      GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
    );
  await alpha.lobbyClientHarness.selectSavedCharacterInProgressionGame(
    alphaSecondCharacter.combatant.getEntityId()
  );
  // selecting player sees newly selected character
  await bravoSawAlphaSelectDeeperFloorCharacterPromise;

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
  const { savedCharacters: bravoSavedCharacters } = bravo.clientApplication.lobbyContext;
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
  alpha.clientApplication.errorRecordService.clear();
  await alpha.lobbyClientHarness.selectProgressionGameStartingFloor(2);
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();

  // selecting lower floor reached character sets selected floor back to lower number
  const alphaSawBravoSwitchBackToLowFloorCharacterPromise =
    alpha.lobbyClientHarness.awaitMessageOfType(
      GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
    );
  const bravoFirstCharacter = bravoSavedCharacters.requireFilledSlot(0);
  await bravo.lobbyClientHarness.selectSavedCharacterInProgressionGame(
    bravoFirstCharacter.combatant.getEntityId()
  );
  await alphaSawBravoSwitchBackToLowFloorCharacterPromise;
  expect(alpha.clientApplication.gameContext.requireGame().maxStartingFloor).toBe(1);
  expect(alpha.clientApplication.gameContext.requireGame().selectedStartingFloor).toBe(1);
  expect(
    alpha.clientApplication.gameContext.requireParty().dungeonExplorationManager.getCurrentFloor()
  ).toBe(1);
}

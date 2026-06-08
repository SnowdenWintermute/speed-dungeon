import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED,
  CharacterControlScheme,
  CombatantClass,
  ERROR_MESSAGES,
  GameStateUpdateType,
  invariant,
} from "@speed-dungeon/common";

export async function testProgressionGameStartingFloorSelection(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(undefined, BASIC_CHARACTER_FIXTURES_INCREASING_FLOORS_VISITED);
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior },
        { name: "deeper floor character", combatantClass: CombatantClass.Warrior },
      ],
    },
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior },
        { name: "deeper floor character", combatantClass: CombatantClass.Warrior },
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
  const alphaSecondCharacter =
    alphaSavedCharacters.byControlScheme[CharacterControlScheme.Captain][1];
  invariant(alphaSecondCharacter !== undefined, "expected alpha second saved character");

  const bravoSawAlphaSelectDeeperFloorCharacterPromise =
    bravo.lobbyClientHarness.awaitMessageOfType(
      GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
    );

  const alphaFirstCharacter =
    alphaSavedCharacters.byControlScheme[CharacterControlScheme.Captain][0];
  invariant(alphaFirstCharacter !== undefined, "expected alpha first saved character");
  await alpha.lobbyClientHarness.removeSavedCharacterFromProgressionGame(
    alphaFirstCharacter.combatant.getEntityId()
  );
  await alpha.lobbyClientHarness.addSavedCharacterToProgressionGame(
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
  const bravoSecondCharacter =
    bravoSavedCharacters.byControlScheme[CharacterControlScheme.Captain][1];
  invariant(bravoSecondCharacter !== undefined, "expected bravo second saved character");
  const alphaSawCharacterSelectedPromise = alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
  );
  const bravoFirstCharacter =
    bravoSavedCharacters.byControlScheme[CharacterControlScheme.Captain][0];
  invariant(bravoFirstCharacter !== undefined, "expected bravo client to have a first character");
  await bravo.lobbyClientHarness.removeSavedCharacterFromProgressionGame(
    bravoFirstCharacter.combatant.getEntityId()
  );
  await bravo.lobbyClientHarness.addSavedCharacterToProgressionGame(
    bravoSecondCharacter.combatant.getEntityId()
  );
  console.log(
    "bravoSecondCharacter",
    bravoSecondCharacter.combatant.combatantProperties.deepestFloorReached
  );
  // alpha sees new max floor has risen
  await alphaSawCharacterSelectedPromise;
  console.log(
    "alpha party:",
    [...alpha.clientApplication.gameContext.requireParty().combatantManager.getAllCombatants()].map(
      ([_, combatant]) => combatant.combatantProperties.deepestFloorReached
    )
  );

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
  await bravo.lobbyClientHarness.removeSavedCharacterFromProgressionGame(
    bravoSecondCharacter.combatant.getEntityId()
  );
  await bravo.lobbyClientHarness.addSavedCharacterToProgressionGame(
    bravoFirstCharacter.combatant.getEntityId()
  );
  await alphaSawBravoSwitchBackToLowFloorCharacterPromise;
  expect(alpha.clientApplication.gameContext.requireGame().maxStartingFloor).toBe(1);
  expect(alpha.clientApplication.gameContext.requireGame().selectedStartingFloor).toBe(1);
  expect(
    alpha.clientApplication.gameContext.requireParty().dungeonExplorationManager.getCurrentFloor()
  ).toBe(1);
}

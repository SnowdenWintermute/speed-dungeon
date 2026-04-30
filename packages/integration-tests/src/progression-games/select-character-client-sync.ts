import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatantClass, GameStateUpdateType } from "@speed-dungeon/common";

export async function testProgressionGameSelectCharacterSync(testFixture: IntegrationTestFixture) {
  testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior, slotIndex: 0 },
        {
          name: "other character",
          combatantClass: CombatantClass.Warrior,
          slotIndex: 1,
        },
      ],
    },
    undefined
  );

  const { savedCharacters: alphaSavedCharacters } = alpha.clientApplication.lobbyContext;
  const alphaFirstCharacter = alphaSavedCharacters.requireFilledSlot(0);

  const alphaPlayerContextAsBravo = bravo.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );
  const bravoViewOfAlphaPlayer = alphaPlayerContextAsBravo.game.players.get(
    alphaPlayerContextAsBravo.player.username
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaFirstCharacter.combatant.getEntityId(),
  ]);

  // other player sees selection
  const alphaSecondCharacter = alphaSavedCharacters.requireFilledSlot(1);
  await alpha.lobbyClientHarness.selectSavedCharacterInProgressionGame(
    alphaSecondCharacter.combatant.getEntityId()
  );
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaSecondCharacter.combatant.getEntityId(),
  ]);
}

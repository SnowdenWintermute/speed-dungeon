import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatantClass,
  GameStateUpdateType,
  invariant,
} from "@speed-dungeon/common";

export async function testProgressionGameSelectCharacterSync(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    {
      characters: [
        { name: "character 1", combatantClass: CombatantClass.Warrior },
        { name: "other character", combatantClass: CombatantClass.Warrior },
      ],
    },
    undefined
  );

  const { savedCharacters: alphaSavedCharacters } = alpha.clientApplication.lobbyContext;
  const alphaCaptainCharacters =
    alphaSavedCharacters.byControlScheme[CharacterControlScheme.Captain];
  const alphaFirstCharacter = alphaCaptainCharacters[0];
  invariant(alphaFirstCharacter !== undefined, "expected first saved character");

  const alphaPlayerContextAsBravo = bravo.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );
  const bravoViewOfAlphaPlayer = alphaPlayerContextAsBravo.game.players.get(
    alphaPlayerContextAsBravo.player.username
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaFirstCharacter.combatant.getEntityId(),
  ]);

  const alphaSecondCharacter = alphaCaptainCharacters[1];
  invariant(alphaSecondCharacter !== undefined, "expected second saved character");
  await alpha.lobbyClientHarness.addSavedCharacterToProgressionGame(
    alphaSecondCharacter.combatant.getEntityId()
  );
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaSecondCharacter.combatant.getEntityId(),
  ]);
}

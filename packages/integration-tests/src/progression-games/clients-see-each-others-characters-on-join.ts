import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CharacterControlScheme, invariant } from "@speed-dungeon/common";

export async function testProgressionGamePlayersSeeEachOthersCharactersOnJoin(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInLobbyProgressionGame(
    undefined,
    undefined
  );

  // first user sees second user's character when they join
  const alphaViewOfBravoPlayerContext = alpha.clientApplication.gameContext.requirePlayerContext(
    bravo.clientApplication.session.requireUsername()
  );

  const { savedCharacters: bravoSavedCharacters } = bravo.clientApplication.lobbyContext;
  const bravoFirstCharacter =
    bravoSavedCharacters.byControlScheme[CharacterControlScheme.Captain][0];
  invariant(bravoFirstCharacter !== undefined, "expected bravo first saved character");
  const alphaViewOfBravoPlayer = alphaViewOfBravoPlayerContext.game.players.get(
    alphaViewOfBravoPlayerContext.player.username
  );
  expect(alphaViewOfBravoPlayer?.characterIds).toStrictEqual([
    bravoFirstCharacter.combatant.getEntityId(),
  ]);

  // second user sees host character
  const bravoViewOfAlphaPlayerContext = bravo.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );
  const { savedCharacters: alphaSavedCharacters } = alpha.clientApplication.lobbyContext;
  const alphaFirstCharacter =
    alphaSavedCharacters.byControlScheme[CharacterControlScheme.Captain][0];
  invariant(alphaFirstCharacter !== undefined, "expected alpha first saved character");
  const bravoViewOfAlphaPlayer = bravoViewOfAlphaPlayerContext.game.players.get(
    bravoViewOfAlphaPlayerContext.player.username
  );
  expect(bravoViewOfAlphaPlayer?.characterIds).toStrictEqual([
    alphaFirstCharacter.combatant.getEntityId(),
  ]);
}

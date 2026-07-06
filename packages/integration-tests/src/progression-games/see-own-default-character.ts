import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CharacterControlScheme, invariant } from "@speed-dungeon/common";

export async function testPlayerSeesOwnDefaultProgressionGameCharacter(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions();
  const alpha = await testFixture.createSingleClientInProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
  const alphaPlayerContext = alpha.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );

  const { savedCharacters } = alpha.clientApplication.lobbyContext;
  const defaultCharacter = savedCharacters.byControlScheme[CharacterControlScheme.Captain][0];
  invariant(defaultCharacter !== undefined, "expected at least one saved Captain character");
  expect(alphaPlayerContext.player.characterIds).toStrictEqual([
    defaultCharacter.combatant.getEntityId(),
  ]);
}

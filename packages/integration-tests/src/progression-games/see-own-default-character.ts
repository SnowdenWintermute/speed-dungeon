import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testPlayerSeesOwnDefaultProgressionGameCharacter(
  testFixture: IntegrationTestFixture
) {
  testFixture.resetWithOptions();
  const alpha = await testFixture.createSingleClientInLobbyProgressionGame(
    "client 1",
    TEST_AUTH_SESSION_ID_PLAYER_1
  );
  const alphaPlayerContext = alpha.clientApplication.gameContext.requirePlayerContext(
    alpha.clientApplication.session.requireUsername()
  );

  const { savedCharacters } = alpha.clientApplication.lobbyContext;
  const defaultCharacter = savedCharacters.requireFilledSlot(0);
  expect(alphaPlayerContext.player.characterIds).toStrictEqual([
    defaultCharacter.combatant.getEntityId(),
  ]);
}

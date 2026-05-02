import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_DUNGEON_FOUR_ONE_HP_WOLVES } from "@speed-dungeon/common";

describe("progression game", () => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });
  //
  // on ladder rank up, all connected players see message
  it("ladder rank up message", async () => {
    await testFixture.resetWithOptions(TEST_DUNGEON_FOUR_ONE_HP_WOLVES);
    const alpha = await testFixture.createSingleClientInLobbyProgressionGame(
      "alpha",
      TEST_AUTH_SESSION_ID_PLAYER_1
    );
    // two clients each in their own progression game
    // alpha client battle victory
    // alpha and bravo client see message
  });
  // on ladder death, other players see death message
  // it("ladder death message", async () => {
  //   // two clients each in their own progression game
  //   // alpha client is playing with a ranked character in the top 10
  //   // alpha party wipes
  //   // alpha and bravo client see ladder death message
  // });
  // // on ladder death/rank change, ladder page request shows correct rankings
  // it("ladder page ranks", async () => {
  //   // fetch page before rank
  //   // client gains ladder rank
  //   // fetch page shows rank
  //   // client wipes
  //   // fetch page shows no rank
  // });
});

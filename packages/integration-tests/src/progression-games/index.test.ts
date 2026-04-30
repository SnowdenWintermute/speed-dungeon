import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  testCreateProgressionGameRequiresSavedCharacter,
  testJoinProgressionGameRequiresSavedCharacter,
} from "./progression-game-requires-saved-character";
import { testProgressionGameRequiresNotInOtherGame } from "./progression-game-requires-not-in-other-game";
import {
  testCreateProgressionGameRequiresAuth,
  testJoinProgressionGameRequiresAuth,
} from "./progression-game-requires-auth";

describe("progression game", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("create requires auth", async () => {
    await testCreateProgressionGameRequiresAuth(testFixture);
  });
  it("join requires auth", async () => {
    await testJoinProgressionGameRequiresAuth(testFixture);
  });
  it("create requires saved character", async () => {
    await testCreateProgressionGameRequiresSavedCharacter(testFixture);
  });
  it("join requires saved character", async () => {
    await testJoinProgressionGameRequiresSavedCharacter(testFixture);
  });

  it("one game per user", async () => {
    await testProgressionGameRequiresNotInOtherGame(testFixture);
  });
});

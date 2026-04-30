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
import { testPlayerSeesOwnDefaultProgressionGameCharacter } from "./see-own-default-character";
import { testProgressionGamePlayersSeeEachOthersCharactersOnJoin } from "./clients-see-each-others-characters-on-join";
import { testProgressionGameSelectCharacterSync } from "./select-character-client-sync";
import { testProgressionGameStartingFloorSelection } from "./starting-floor-selection";

describe("progression game", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("progression game starting floor", async () => {
    await testProgressionGameStartingFloorSelection(testFixture);
  });
  it("progression game other client sees character selection", async () => {
    await testProgressionGameSelectCharacterSync(testFixture);
  });
  it("players sees each other's progression game characters on player join", async () => {
    await testProgressionGamePlayersSeeEachOthersCharactersOnJoin(testFixture);
  });
  it("player sees own progression game character", async () => {
    await testPlayerSeesOwnDefaultProgressionGameCharacter(testFixture);
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

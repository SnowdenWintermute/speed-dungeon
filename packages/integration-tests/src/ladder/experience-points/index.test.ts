import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testProgressionCharacterExperiencePointsLadderReads } from "./progression-character-xp-ladder-reads";
import { testControlSchemeLaddersAreSeparate } from "./control-scheme-ladders-are-separate";
import { testDeadCharacterLeavesTheLadder } from "./dead-character-leaves-the-ladder";
import { testDeletedSavedCharacterLeavesTheLadder } from "./deleted-saved-character-leaves-the-ladder";
import {
  testOwnLadderDeathMessages,
  testOwnLadderRankUpMessages,
} from "./own-ladder-progress-messages";
import {
  testGlobalLadderDeathMessages,
  testGlobalLadderRankUpMessages,
} from "./global-ladder-progress-messages";

// not parametrized over the ladder-records persistence strategies like the read-queries suite is:
// the experience points ladders are sorted sets joined to saved characters, and never touch a
// LadderRecordsPersistenceStrategy
describe("experience points ladder", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("ranks a progression character by experience earned in a real battle", async () => {
    await testProgressionCharacterExperiencePointsLadderReads(testFixture);
  });

  it("ranks each control scheme on its own ladder", async () => {
    await testControlSchemeLaddersAreSeparate(testFixture);
  });

  it("drops a character from the ladder when it dies", async () => {
    await testDeadCharacterLeavesTheLadder(testFixture);
  });

  it("drops a character from the ladder when its saved character is deleted", async () => {
    await testDeletedSavedCharacterLeavesTheLadder(testFixture);
  });

  it("shows a player their own ladder rank up messages", async () => {
    await testOwnLadderRankUpMessages(testFixture);
  });

  it("shows a player their own ladder death messages", async () => {
    await testOwnLadderDeathMessages(testFixture);
  });

  it("shows ladder rank up messages to players on every connected server", async () => {
    await testGlobalLadderRankUpMessages(testFixture);
  });

  it("shows ladder death messages to players on every connected server", async () => {
    await testGlobalLadderDeathMessages(testFixture);
  });
});

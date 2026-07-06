import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testSaveGameRecordOnGameStart } from "./save-game-record-on-start";

describe("game records", () => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("saves game records on game start", async () => {
    await testSaveGameRecordOnGameStart(testFixture);
  });
});

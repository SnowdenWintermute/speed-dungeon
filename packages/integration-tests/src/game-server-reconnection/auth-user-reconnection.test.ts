import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testRetryLostInitialConnectionInstructions } from "./retry-lost-initial-connection-instructions";

describe("auth user reconnection", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("retry initial game server connection", async () => {
    await testRetryLostInitialConnectionInstructions(testFixture);
  });
});

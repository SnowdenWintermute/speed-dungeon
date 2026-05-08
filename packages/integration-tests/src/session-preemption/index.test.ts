import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

describe("connection preemption", () => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("lobby connection preemption", async () => {
    await testFixture.resetWithOptions();
    // auth session preemption in lobby
    // -  session 1 connects
    // -  session 2 connects
    // -  session 1 shows disconnected and in offline mode and last message received is
    //   "you were disconnected because another client with your identity connected"
    // - session 2 shows last message "your client preempted another session owned by this account"
  });
});

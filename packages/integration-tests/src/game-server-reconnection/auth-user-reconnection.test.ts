import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  testLateJoinerToGameAfterOtherPlayersLeft,
  testRetryLostInitialConnectionInstructions,
} from "./retry-lost-initial-connection-instructions";

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

  it("late joiner after first left", async () => {
    await testLateJoinerToGameAfterOtherPlayersLeft(testFixture);
  });
});

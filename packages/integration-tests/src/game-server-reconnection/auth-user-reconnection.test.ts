import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  testLateJoinerToGameAfterOtherPlayersLeft,
  testRetryLostInitialConnectionInstructions,
} from "./retry-lost-initial-connection-instructions";
import { testReconnectToClosedIronmanGame } from "./reconnection-after-closed-game";

describe("auth user reconnection", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("retry initial game server connection", async () => {
    await testRetryLostInitialConnectionInstructions(testFixture);
  });

  it("late joiner after first left", async () => {
    await testLateJoinerToGameAfterOtherPlayersLeft(testFixture);
  });

  it("reconnection to closed ironman game", async () => {
    await testReconnectToClosedIronmanGame(testFixture);
  });
});

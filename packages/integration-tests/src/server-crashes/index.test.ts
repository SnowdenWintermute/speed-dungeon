import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testStaleGameServerPruning } from "./stale-game-server-pruning";

describe("server crashes", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("prunes a game server that stopped heartbeating", async () => {
    await testStaleGameServerPruning(testFixture);
  });
});

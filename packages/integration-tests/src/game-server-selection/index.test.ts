import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testSendsNewGameToLeastBusyServer } from "./sends-new-game-to-least-busy-server";
import { testCountsPendingSetups } from "./counts-pending-setups";
import { testSkipsStaleServer } from "./skips-stale-server";
import { testNoLiveGameServers } from "./no-live-game-servers";

describe("least busy game server selection", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("sends a new game to the server hosting the fewest games", async () => {
    await testSendsNewGameToLeastBusyServer(testFixture);
  });

  it("counts pending setups as well as active games", async () => {
    await testCountsPendingSetups(testFixture);
  });

  it("skips a server that stopped heartbeating", async () => {
    await testSkipsStaleServer(testFixture);
  });

  it("errors when no game server is live", async () => {
    await testNoLiveGameServers(testFixture);
  });
});

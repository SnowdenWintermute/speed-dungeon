import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testServerErrorRejectsQuery } from "./server-error-rejects-query";
import { testReconnectFailsPendingQueries } from "./reconnect-fails-pending-queries";

// the failure paths of the ladder query plumbing itself. these never reach a persistence strategy,
// so unlike the read queries they are not worth running against postgres
describe("ladder query transport", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("rejects a query when the server errors handling it", async () => {
    await testServerErrorRejectsQuery(testFixture);
  });

  it("fails queries left pending by a reconnect", async () => {
    await testReconnectFailsPendingQueries(testFixture);
  });
});

import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testGuestReconnectionTokenReuse } from "./guest-reconnection-token-reuse";
import { testNoGuestReconnectionAfterLogin } from "./no-guest-reconnect-after-login";

describe("guest token reuse", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("guest reconnection token reuse", async () => {
    await testGuestReconnectionTokenReuse(testFixture);
  });

  it(`no guest reconnection after login`, async () => {
    await testNoGuestReconnectionAfterLogin(testFixture);
  });
});

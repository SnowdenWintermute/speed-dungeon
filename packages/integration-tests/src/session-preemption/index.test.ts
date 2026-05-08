import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CLIENT_APP_MESSAGES, ClientAppMessageType } from "@speed-dungeon/common";

describe("connection preemption", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("lobby connection preemption", async () => {
    await testFixture.resetWithOptions();
    const alphaTab = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alphaTab.connect();
    expect(alphaTab.clientApplication.topologyManager.isOnline).toBeTruthy();
    const bravoTab = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_1);
    await bravoTab.connect();
    await alphaTab.eventually(() => {
      expect(alphaTab.clientApplication.topologyManager.isOnline).toBeFalsy();
    });
    await alphaTab.eventually(() => {
      expect(alphaTab.clientApplication.eventLogStore.getLast()?.message).toBe(
        CLIENT_APP_MESSAGES[ClientAppMessageType.DisconnectedByPreemption]
      );
    });
    expect(bravoTab.clientApplication.topologyManager.isOnline).toBeTruthy();
    expect(bravoTab.clientApplication.eventLogStore.getLast()?.message).toBe(
      CLIENT_APP_MESSAGES[ClientAppMessageType.OtherConnectionPreempted]
    );
  });
});

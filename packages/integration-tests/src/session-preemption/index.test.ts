import { TEST_AUTH_SESSION_ID_PLAYER_1 } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CLIENT_APP_MESSAGES, ClientAppMessageType, invariant } from "@speed-dungeon/common";

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

  it("game server connection preemption", async () => {
    await testFixture.resetWithOptions();
    testFixture.timeMachine.start();
    const alpha = await testFixture.createSingleClientInProgressionGame(
      "alpha",
      TEST_AUTH_SESSION_ID_PLAYER_1,
      { proceedToGameServer: true }
    );
    const bravo = testFixture.createClient("bravo", TEST_AUTH_SESSION_ID_PLAYER_1);
    await bravo.connect();
    await alpha.eventually(() => {
      expect(alpha.clientApplication.eventLogStore.getLast()?.message).toBe(
        CLIENT_APP_MESSAGES[ClientAppMessageType.DisconnectedByPreemption]
      );
    });
    expect(alpha.clientApplication.topologyManager.isOnline).toBeFalsy();
    await bravo.clientApplication.transitionToGameServer.waitForStartedOrCompleted();
    await bravo.clientApplication.transitionToGameServer.waitForOrCompleted();
    await bravo.gameClientHarness.toggleReadyToExplore(); // make sure they can issue inputs
    expect(
      bravo.clientApplication.eventLogStore
        .getMessages()
        .find(
          (message) =>
            message.message === CLIENT_APP_MESSAGES[ClientAppMessageType.OtherConnectionPreempted]
        )
    ).toBeTruthy();
  });

  // because reconnection is time bound, and we don't want them having some identity proving
  // credential that isn't bound to a speficic reconnection window
  it("no guest user preemption", async () => {
    await testFixture.resetWithOptions();
    testFixture.timeMachine.start();
    const alpha = await testFixture.createSingleClientInStartedGame();
    const reconnectionToken =
      alpha.clientApplication.reconnectionTokenStore.guestGameReconnectionToken;
    invariant(reconnectionToken !== null);
    const bravo = testFixture.createClient("bravo");
    bravo.clientApplication.reconnectionTokenStore.guestGameReconnectionToken = reconnectionToken;
    await bravo.connect();
    await bravo.clientApplication.waitForReconnectionInstructions.waitFor();
    bravo.eventually(() => {
      expect(bravo.clientApplication.topologyManager.isOnline).toBeTruthy();
    });
    // token is cleared when not recognized as usable
    expect(bravo.clientApplication.reconnectionTokenStore.guestGameReconnectionToken).toBeNull();
    expect(bravo.clientApplication.topologyManager.isOnline).toBeTruthy();
    expect(
      bravo.clientApplication.eventLogStore
        .getMessages()
        .find(
          (message) =>
            message.message === CLIENT_APP_MESSAGES[ClientAppMessageType.ReconnectingToGameServer]
        )
    ).toBeFalsy();
  });
});

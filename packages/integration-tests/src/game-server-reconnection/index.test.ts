import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testInvalidSessionClaimToken } from "./session-claim-tokens/invalid-session-claim-token";
import { testSessionClaimTokenRequired } from "./session-claim-tokens/session-claim-token-required";
import { testSessionClaimTokenReuse } from "./session-claim-tokens/session-claim-token-reuse";
import { testReconnectionSuccess } from "./reconnection-success";
import { testReconnectionDuringActionReplay } from "./reconnection-in-battle/reconnection-during-action-replay";
import { testReconnectionDuringVictoryReplay } from "./reconnection-in-battle/reconnection-during-victory-replay";
import { testReconnectionDuringWipeReplay } from "./reconnection-in-battle/reconnection-during-wipe-replay";
import { testIntentionalLeaveGame } from "./intentional-leave-game";
import { testReconnectionTimeoutGameCleanup } from "./reconnection-timeout-game-cleanup";
import { testReconnectionAfterTimeout } from "./reconnection-after-timeout";
import { testReconnectionAfterAllPlayersDisconnected } from "./reconnection-after-all-players-disconnected";
import { testInputsWhileAwaitingPlayers } from "./inputs-while-awaiting-players";
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

describe.each([
  { useAuthenticatedUsers: true, name: "auth users" },
  { useAuthenticatedUsers: false, name: "guest users" },
])(`game server reconnection`, ({ useAuthenticatedUsers, name }) => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it(`${name} reconnection success`, async () => {
    await testReconnectionSuccess(testFixture, { useAuthenticatedUsers });
  });

  it("reconnection timeout game cleanup", async () => {
    await testReconnectionTimeoutGameCleanup(testFixture, { useAuthenticatedUsers });
  });

  it(`${name} intentional leave game`, async () => {
    await testIntentionalLeaveGame(testFixture, { useAuthenticatedUsers });
  });

  it(`${name} reconnection after all players disconnect`, async () => {
    await testReconnectionAfterAllPlayersDisconnected(testFixture, { useAuthenticatedUsers });
  });

  it("reconnection during wipe replay", async () => {
    await testReconnectionDuringWipeReplay(testFixture, { useAuthenticatedUsers });
  });

  it("reconnection during victory replay", async () => {
    await testReconnectionDuringVictoryReplay(testFixture, { useAuthenticatedUsers });
  });

  it("reconnection during action replay", async () => {
    await testReconnectionDuringActionReplay(testFixture, { useAuthenticatedUsers });
  });

  it("session claim token reuse", async () => {
    await testSessionClaimTokenReuse(testFixture, { useAuthenticatedUsers });
  });

  it("invalid session claim token", async () => {
    await testInvalidSessionClaimToken(testFixture, { useAuthenticatedUsers });
  });

  it("session claim token required", async () => {
    await testSessionClaimTokenRequired(testFixture, { useAuthenticatedUsers });
  });

  it(`${name} reconnection timeout`, async () => {
    await testReconnectionAfterTimeout(testFixture, { useAuthenticatedUsers });
  });

  it("inputs while awaiting players", async () => {
    await testInputsWhileAwaitingPlayers(testFixture, { useAuthenticatedUsers });
  });
});

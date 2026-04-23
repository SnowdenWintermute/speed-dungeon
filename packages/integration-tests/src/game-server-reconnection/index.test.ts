import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testInvalidSessionClaimToken } from "./session-claim-tokens/invalid-session-claim-token";
import { testSessionClaimTokenRequired } from "./session-claim-tokens/session-claim-token-required";
import { testSessionClaimTokenReuse } from "./session-claim-tokens/session-claim-token-reuse";
import { testGuestReconnectionAfterTimeout } from "./guest-reconnection/guest-reconnection-after-timeout";
import { testGuestReconnectionTokenReuse } from "./guest-reconnection/guest-reconnection-token-reuse";
import { testInputsWhileAwaitingPlayers } from "./inputs-while-awaiting-players";
import { testGuestReconnectionSuccess } from "./guest-reconnection/guest-reconnection-success";
import { testReconnectionDuringActionReplay } from "./reconnection-in-battle/reconnection-during-action-replay";
import { testReconnectionDuringVictoryReplay } from "./reconnection-in-battle/reconnection-during-victory-replay";

describe("game server reconnection", () => {
  // it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });

  it("reconnection during victory replay", async () => {
    await testReconnectionDuringVictoryReplay(testFixture);
  });

  // it("reconnection during action replay", async () => {
  //   await testReconnectionDuringActionReplay(testFixture);
  // });

  // it("session claim token reuse", async () => {
  //   await testSessionClaimTokenReuse(testFixture);
  // });

  // it("invalid session claim token", async () => {
  //   await testInvalidSessionClaimToken(testFixture);
  // });

  // it("session claim token required", async () => {
  //   await testSessionClaimTokenRequired(testFixture);
  // });

  // it("guest reconnection timeout", async () => {
  //   await testGuestReconnectionAfterTimeout(testFixture);
  // });

  // it("guest reconnection token reuse", async () => {
  //   await testGuestReconnectionTokenReuse(testFixture);
  // });

  // it("inputs while awaiting players", async () => {
  //   await testInputsWhileAwaitingPlayers(testFixture);
  // });

  // it("reconnection success", async () => {
  //   testGuestReconnectionSuccess(testFixture);
  // });
});

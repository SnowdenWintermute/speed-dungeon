import { TEST_GAME_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { CombatActionName, GameStateUpdateType } from "@speed-dungeon/common";

// if last player leaving
// - remove game server game
// - remove server side valkey(or shared store) game record
//
// don't attempt reconnect if leave game intentionally
//  - destroy client guest reconnection token
//  - destroy server side reconnection opportunity (or just don't create one)
// can make game of previously existing game name if all players intentionally left it
// can make game of previously existing game name if it timed out all reconnection opportunities

export async function testIntentionalLeaveGame(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();
  alpha.clientApplication.gameClientRef.get().leaveGame();
  await alpha.connect();
  // bravo doesn't get input lock, doesn't see reconnecting player in list
  expect(
    bravo.clientApplication.gameContext.requireParty().playerUsernamesAwaitingReconnection.size
  ).toBe(0);
  bravo.gameClientHarness.selectCombatAction(CombatActionName.Healing, 1);
  expect(bravo.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  // doesn't get reconnection instructions
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  expect(() => alpha.clientApplication.waitForReconnectionInstructions.waitFor()).toThrow();
  expect(() => alpha.clientApplication.transitionToGameServer.waitFor()).toThrow();
  // create same named game after all players left
  bravo.clientApplication.gameClientRef.get().leaveGame();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME);
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
}

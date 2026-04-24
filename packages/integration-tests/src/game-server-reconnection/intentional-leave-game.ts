import { TEST_GAME_NAME } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

// if last player leaving
// - remove game server game
// - remove server side valkey(or shared store) game record
// - remove lobby forwarding records
//
// don't attempt reconnect if leave game intentionally
// can make game of previously existing game name if all players intentionally left it
// can make game of previously existing game name if it timed out all reconnection opportunities

export async function testIntentionalLeaveGame(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();
  alpha.clientApplication.gameClientRef.get().leaveGame();
  bravo.clientApplication.gameClientRef.get().leaveGame();
  await alpha.connect();
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
  await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME);
  expect(alpha.clientApplication.errorRecordService.getLastError()).toBeUndefined();
}

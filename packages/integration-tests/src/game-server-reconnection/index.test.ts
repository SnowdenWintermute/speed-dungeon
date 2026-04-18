import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_GAME_NAME, TEST_GAME_SERVER_URL, TEST_PARTY_NAME } from "@/servers/fixtures";
import { websocketFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatantClass,
  invariant,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

describe("game server reconnection", () => {
  const testFixture = new IntegrationTestFixture(websocketFactory);

  afterEach(async () => {
    await Promise.all([
      testFixture.lobbyServer.closeTransportServer(),
      testFixture.gameServer.closeTransportServer(),
    ]);
  });
  // auth and guest versions needed:
  it("reconnection success", async () => {
    console.log("reconnection success test");
    testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);

    const A = testFixture.createClient("client a");
    const B = testFixture.createClient("client b");
    console.log("connection promises");
    await Promise.all([A.connect(), B.connect()]);
    console.log("completed");

    await A.lobbyClientHarness.createGame(TEST_GAME_NAME);
    await A.lobbyClientHarness.createParty(TEST_PARTY_NAME);
    await A.lobbyClientHarness.createCharacter("a", CombatantClass.Rogue);

    await B.lobbyClientHarness.fetchGameList();
    const gameInList = B.clientApplication.lobbyContext.gameList[0];
    invariant(gameInList !== undefined);
    expect(gameInList.gameName).toBe(TEST_GAME_NAME);

    await B.lobbyClientHarness.joinGame(TEST_GAME_NAME);
    await B.lobbyClientHarness.joinParty(TEST_PARTY_NAME);
    await B.lobbyClientHarness.createCharacter("b", CombatantClass.Warrior);

    await Promise.all([
      A.lobbyClientHarness.toggleReadyToStartGame(),
      B.lobbyClientHarness.toggleReadyToStartGame(),
    ]);

    // B create
    // B connect
    // B get game list
    // B join game
    // B join party
    // B create character
    // B toggle ready
    //
    // A sees clientB

    await A.clientApplication.sequentialEventProcessor.waitUntilIdle();
    await A.clientApplication.transitionToGameServer.waitFor();
  });
});

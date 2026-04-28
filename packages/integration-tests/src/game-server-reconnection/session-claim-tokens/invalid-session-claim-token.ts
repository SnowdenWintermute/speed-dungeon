import { localServerUrl } from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  ERROR_MESSAGES,
  GameStateUpdateType,
  invariant,
  QUERY_PARAMS,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testInvalidSessionClaimToken(
  testFixture: IntegrationTestFixture,
  options: { useAuthenticatedUsers: boolean }
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame({
    auth: options.useAuthenticatedUsers,
  });

  console.log("about to await close");
  await alpha.clientApplication.gameClientRef.get().close();
  console.log("closed");
  await alpha.connect();

  console.log("about to await gameConnectionInstructions");
  const gameConnectionInstructions = await alpha.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  invariant(
    gameConnectionInstructions.type === GameStateUpdateType.GameServerConnectionInstructions
  );
  const { encryptedSessionClaimToken } = gameConnectionInstructions.data.connectionInstructions;
  const someInvalidToken = encryptedSessionClaimToken + " ";

  console.log("about to await transitionToGameServer");
  await alpha.clientApplication.transitionToGameServer.waitFor();

  await alpha.clientApplication.gameClientRef.get().close();

  const queryParams = [
    {
      name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
      value: someInvalidToken,
    },
  ];

  alpha.clientApplication.topologyManager.createGameClient(
    localServerUrl(testFixture.gameServerPort),
    queryParams
  );
  console.log("about to await connectionRejectedPromise");
  const connectionRejectedPromise = new Promise<void>((resolve, reject) => {
    alpha.clientApplication.gameClientRef.get().connectionEndpoint.on("close", (_code, message) => {
      expect(message).toBe(ERROR_MESSAGES.SERVERS.INVALID_TOKEN);
      resolve();
    });
  });
  await connectionRejectedPromise;
}

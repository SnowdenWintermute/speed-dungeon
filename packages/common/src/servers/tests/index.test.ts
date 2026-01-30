import { describe } from "vitest";
import { LobbyServer } from "../lobby-server/index.js";
import { GameServer } from "../game-server/index.js";
import { createTestServers } from "./fixtures/create-test-servers.js";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "./fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../../test-utils/time-machine.js";
import { lobbyGameSetupTests } from "./lobby-game-setup-tests.js";
import { sessionClaimTokenTests } from "./session-claim-token-tests.js";
import { awaitReconnectionGameInputLockTests } from "./await-reconnection-game-input-lock-tests.js";
import { reconnectionTests } from "./reconnection-tests.js";
import { TestClient } from "../../test-utils/test-client.js";
import { TEST_AUTH_SESSION_ID, TEST_LOBBY_URL } from "./fixtures/index.js";

// @TODO
// - reconnection with auth user

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "$name reconnection flow",
  (clientEndpointFactory) => {
    let lobbyServer: LobbyServer;
    let gameServer: GameServer;
    const timeMachine = new TimeMachine();

    beforeEach(async () => {
      const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
        clientEndpointFactory.createIncomingConnectionGateways();

      const inMemoryTransportAndServers = await createTestServers(
        lobbyIncomingConnectionGateway,
        gameServerIncomingConnectionGateway
      );

      lobbyServer = inMemoryTransportAndServers.lobbyServer;
      gameServer = inMemoryTransportAndServers.gameServer;
    });

    afterEach(async () => {
      lobbyServer.closeTransportServer();
      gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    // lobbyGameSetupTests(clientEndpointFactory);
    // sessionClaimTokenTests(clientEndpointFactory);
    // awaitReconnectionGameInputLockTests(clientEndpointFactory, timeMachine);
    // reconnectionTests(clientEndpointFactory, timeMachine);

    it("logged in user", async () => {
      const hostClient = new TestClient();
      const hostEndpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
        headers: { cookie: `id=${TEST_AUTH_SESSION_ID}` },
      });
      hostClient.initializeEndpoint(hostEndpoint);

      await hostClient.connect();
    });
  }
);

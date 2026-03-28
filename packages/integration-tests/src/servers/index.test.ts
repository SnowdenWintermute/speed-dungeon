import { GameServer, LobbyServer } from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "./fixtures/test-connection-endpoint-factories.js";
import { createTestServers } from "./fixtures/create-test-servers.js";
import { lobbyGameSetupTests } from "./lobby-game-setup-tests.js";
import { sessionClaimTokenTests } from "./session-claim-token-tests.js";
import { awaitReconnectionGameInputLockTests } from "./await-reconnection-game-input-lock-tests.js";
import { reconnectionTests } from "./reconnection-tests.js";
import { TimeMachine } from "../test-utils/time-machine.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "$name reconnection flow",
  ({ clientEndpointFactory, authSessionIds }) => {
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

    lobbyGameSetupTests(clientEndpointFactory, authSessionIds);
    sessionClaimTokenTests(clientEndpointFactory, authSessionIds);
    awaitReconnectionGameInputLockTests(clientEndpointFactory, timeMachine, authSessionIds);
    reconnectionTests(clientEndpointFactory, timeMachine, authSessionIds);
  }
);

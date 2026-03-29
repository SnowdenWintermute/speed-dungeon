// need to be able to:
// - outfit a party of characters with specific
//   - stats
//   - abilities
//   - test equipment with specific
//     - durability state
//     - affixes with set values
// - enter a battle with monsters with specific
//   - stats
// - to this end we can create "test dungeon floors" filled with rooms of test fixture monsters
//
// - configure test game server with a RandomNumberGenerator that gives constant or scripted rolls (0.5, or [0.1, 0.5,...] for example)
// - trigger player client to dispatch actions to a test game server
// - await resolution of client handling of messages from test game server
// - assert game client state

import { GameServer, IndexedDbAssetStore, LobbyServer } from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { createTestServers } from "../servers/fixtures/create-test-servers.js";
import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers.js";
import { indexedDB } from "fake-indexeddb";

// - continue with more actions and state assertions for complex scenarios
describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "experiment with new architecture",
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

    it("instantiates", () => {
      const assetCache = new IndexedDbAssetStore(indexedDB);
      const tickScheduler = new ManualTickScheduler();
      const clientApplication = new ClientApplication(
        assetCache,
        "http://localhost:8080",
        tickScheduler.scheduler
      );
      expect(clientApplication).toBeDefined();
    });
  }
);

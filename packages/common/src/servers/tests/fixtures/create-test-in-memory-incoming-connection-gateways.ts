import { TEST_GAME_SERVER_URL, TEST_LOBBY_URL } from "./index.js";
import { InMemoryConnectionEndpointServer } from "../../../transport/in-memory-connection-endpoint-server.js";
import { InMemoryConnectionEndpointServerRegistry } from "../../../transport/in-memory-connection-endpoint-server-registry.js";
import { InMemoryIncomingConnectionGateway } from "../../in-memory-incoming-connection-gateway.js";

export function createTestInMemoryIncomingConnectionGateways() {
  const lobbyConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    TEST_LOBBY_URL,
    lobbyConnectionEndpointServer
  );

  const lobbyIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    lobbyConnectionEndpointServer
  );

  const gameServerConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    TEST_GAME_SERVER_URL,
    gameServerConnectionEndpointServer
  );

  const gameServerIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    gameServerConnectionEndpointServer
  );

  return {
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
  };
}

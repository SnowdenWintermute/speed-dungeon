import {
  InMemoryConnectionEndpointServer,
  InMemoryConnectionEndpointServerRegistry,
  InMemoryIncomingConnectionGateway,
} from "@speed-dungeon/common";
import { TEST_GAME_SERVER_URL, TEST_LOBBY_URL } from "./index.js";

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

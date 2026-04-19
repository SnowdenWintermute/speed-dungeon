import {
  InMemoryConnectionEndpointServer,
  InMemoryConnectionEndpointServerRegistry,
  InMemoryIncomingConnectionGateway,
} from "@speed-dungeon/common";
import {
  LOCAL_GAME_SERVER_PORT,
  LOCAL_GAME_SERVER_URL,
  LOCAL_LOBBY_SERVER_PORT,
  LOCAL_LOBBY_URL,
} from ".";

export function createTestInMemoryIncomingConnectionGateways() {
  const lobbyConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    LOCAL_LOBBY_URL,
    lobbyConnectionEndpointServer
  );

  const lobbyIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    lobbyConnectionEndpointServer
  );

  const gameServerConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    LOCAL_GAME_SERVER_URL,
    gameServerConnectionEndpointServer
  );

  const gameServerIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    gameServerConnectionEndpointServer
  );

  return {
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
    lobbyServerPort: LOCAL_LOBBY_SERVER_PORT,
    gameServerPort: LOCAL_GAME_SERVER_PORT,
  };
}

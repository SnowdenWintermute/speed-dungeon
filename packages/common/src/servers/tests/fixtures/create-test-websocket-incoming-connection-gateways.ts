import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "../../node-websocket-incoming-connection-gateway.js";
import { TEST_GAME_SERVER_PORT, TEST_LOBBY_SERVER_PORT } from "./index.js";

export function createTestWebSocketIncomingConnectionGateways() {
  const lobbyWebSocketServer = new WebSocketServer({ port: TEST_LOBBY_SERVER_PORT });
  const lobbyIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
    lobbyWebSocketServer
  );
  const gameServerWebSocketServer = new WebSocketServer({ port: TEST_GAME_SERVER_PORT });
  const gameServerIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
    gameServerWebSocketServer
  );

  return {
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
  };
}

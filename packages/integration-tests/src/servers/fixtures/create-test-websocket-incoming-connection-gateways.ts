import { WebSocketServer } from "ws";
import { NodeWebSocketIncomingConnectionGateway } from "@speed-dungeon/server";
import { invariant } from "@speed-dungeon/common";

export function createTestWebSocketIncomingConnectionGateways() {
  const lobbyWebSocketServer = new WebSocketServer({ port: 0 });
  const lobbyServerPort = getPortFromAddress(lobbyWebSocketServer);

  const lobbyIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
    lobbyWebSocketServer
  );
  const gameServerWebSocketServer = new WebSocketServer({ port: 0 });
  const gameServerIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
    gameServerWebSocketServer
  );
  const gameServerPort = getPortFromAddress(gameServerWebSocketServer);

  return {
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
    lobbyServerPort,
    gameServerPort,
  };
}

function getPortFromAddress(server: WebSocketServer) {
  const address = server.address();
  invariant(
    typeof address === "object" && address !== null,
    "websocket server address failed to create"
  );
  return address.port;
}

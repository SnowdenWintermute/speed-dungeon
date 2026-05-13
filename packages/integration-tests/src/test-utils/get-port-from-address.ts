import { WebSocketServer } from "ws";
import { invariant } from "@speed-dungeon/common";

export function getPortFromAddress(server: WebSocketServer) {
  const address = server.address();
  invariant(
    typeof address === "object" && address !== null,
    "websocket server address failed to create"
  );
  return address.port;
}

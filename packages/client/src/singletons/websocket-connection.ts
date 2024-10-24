import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { Socket, io } from "socket.io-client";

const socketAddress =
  process.env.NEXT_PUBLIC_PRODUCTION === "production"
    ? "https://roguelikeracing.com"
    : "http://localhost:8080";

export const websocketConnection: Socket<ServerToClientEventTypes, ClientToServerEventTypes> = io(
  socketAddress || "",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  }
);

export function resetWebsocketConnection() {
  websocketConnection.disconnect();
  websocketConnection.connect();
  console.log("reconnecting");
}

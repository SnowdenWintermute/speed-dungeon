import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "./index.js";
import { Socket } from "socket.io";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { EventsMap } from "socket.io/dist/typed-events.js";

export default function getConnection<T extends EventsMap, U extends EventsMap>(
  this: GameServer,
  socketId: string
): [undefined | Socket<T, U>, BrowserTabSession] {
  const namespace = "/";
  let socketMeta = this.connections.get(socketId);
  let socket = this.io.of(namespace).sockets.get(socketId);
  if (!socketMeta) {
    socket?.emit(ServerToClientEvent.ErrorMessage, "Socket not registered");
    throw new Error("Socket not registered");
  } else {
    return [socket, socketMeta];
  }
}

import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from ".";
import { Socket } from "socket.io";
import { SocketConnectionMetadata } from "./socket-connection-metadata";
import { EventsMap } from "socket.io/dist/typed-events";

export default function getConnection<T extends EventsMap, U extends EventsMap>(
  this: GameServer,
  socketId: string
): [undefined | Socket<T, U>, SocketConnectionMetadata] {
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

import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from ".";
import { Socket } from "socket.io";
import { SocketConnectionMetadata } from "./socket-connection-metadata";

export default function getConnection(
  this: GameServer,
  socketId: string,
  namespace: SocketNamespaces
): [undefined | Socket, SocketConnectionMetadata] {
  let socketMeta = this.connections.get(socketId);
  let socket = this.io.of(namespace).sockets.get(socketId);
  if (!socketMeta) {
    socket?.emit(ServerToClientEvent.ErrorMessage, "Socket not registered");
    throw new Error(
      "a client tried to create a game but their socket wasn't registered"
    );
  } else {
    return [socket, socketMeta];
  }
}

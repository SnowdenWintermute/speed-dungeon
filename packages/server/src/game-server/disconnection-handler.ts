import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SocketNamespaces,
  removeFromArray,
} from "@speed-dungeon/common";
import { GameServer } from ".";
import { Socket } from "socket.io";

export default function disconnectionHandler(
  this: GameServer,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on("disconnect", () => {
    const socketMetadata = this.connections.get(socket.id);
    console.log(`-- ${socketMetadata?.username} (${socket.id})  disconnected`);
    if (!socketMetadata)
      return console.error("a socket disconnected but couldn't find their metadata");

    const userCurrentSockets = this.socketIdsByUsername.get(socketMetadata.username);
    if (userCurrentSockets) removeFromArray(userCurrentSockets, socket.id);
    if (userCurrentSockets && Object.keys(userCurrentSockets).length < 1)
      this.socketIdsByUsername.remove(socketMetadata.username);

    if (socketMetadata.currentGameName) {
      this.leaveGameHandler(socket.id);
    }

    if (socketMetadata.currentMainChannelName) {
      this.removeSocketFromChannel(
        socket.id,
        SocketNamespaces.Main,
        socketMetadata.currentMainChannelName
      );
    }

    this.connections.remove(socket.id);
  });
}

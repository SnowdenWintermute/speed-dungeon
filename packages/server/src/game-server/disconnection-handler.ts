import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SocketNamespaces,
} from "@speed-dungeon/common";
import { GameServer } from ".";
import { Socket } from "socket.io";

export default function disconnectionHandler(
  this: GameServer,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  console.log("setting disconnectionHandler");
  socket.on("disconnect", () => {
    const socketMetadata = this.connections.get(socket.id);
    console.log(
      `user with id ${socket.id} and username ${socketMetadata?.username} disconnected`
    );
    if (!socketMetadata)
      return console.error(
        "a socket disconnected but couldn't find their metadata"
      );
    // remove them from rooms
    if (socketMetadata.currentMainChannelName) {
      this.removeSocketFromChannel(
        socket.id,
        SocketNamespaces.Main,
        socketMetadata.currentMainChannelName
      );
    }
    if (socketMetadata.currentPartyChannelName) {
      this.removeSocketFromChannel(
        socket.id,
        SocketNamespaces.Party,
        socketMetadata.currentPartyChannelName
      );
    }

    // remove from games

    this.connections.delete(socket.id);
  });
}

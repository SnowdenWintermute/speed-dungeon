import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  removeFromArray,
} from "@speed-dungeon/common";
import { GameServer } from "./index.js";
import { Socket } from "socket.io";

export default function disconnectionHandler(
  this: GameServer,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on("disconnect", async () => {
    const socketMetadata = this.connections.get(socket.id);
    console.log(`-- ${socketMetadata?.username} (${socket.id})  disconnected`);
    if (!socketMetadata)
      return console.error("a socket disconnected but couldn't find their metadata");

    if (socketMetadata.currentGameName) {
      await this.leaveGameHandler(socket.id);
    }

    const userCurrentSockets = this.socketIdsByUsername.get(socketMetadata.username);
    if (userCurrentSockets) removeFromArray(userCurrentSockets, socket.id);
    if (userCurrentSockets && Object.keys(userCurrentSockets).length < 1)
      this.socketIdsByUsername.remove(socketMetadata.username);

    this.removeSocketFromChannel(socket.id, socketMetadata.channelName);

    this.connections.remove(socket.id);
  });
}

import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
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
    // remove them from rooms
    // remove from games

    this.connections.delete(socket.id);
  });
}

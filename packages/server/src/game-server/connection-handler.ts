import { GameServer } from ".";
import { generateRandomUsername } from "../utils";
import { LOBBY_CHANNEL, SocketNamespaces } from "@speed-dungeon/common";
import { SocketConnectionMetadata } from "./socket-connection-metadata";

export function connectionHandler(this: GameServer) {
  this.io.on("connection", (socket) => {
    const username = generateRandomUsername();
    console.log(
      `a socket connected with id ${socket.id} and username ${username}`
    );
    this.connections.set(
      socket.id,
      new SocketConnectionMetadata(socket.id, username, LOBBY_CHANNEL)
    );
    this.disconnectionHandler(socket);
    this.initiateLobbyEventListeners(socket);
    this.joinSocketToChannel(socket.id, SocketNamespaces.Main, LOBBY_CHANNEL);
  });
}

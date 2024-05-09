import { GameServer } from ".";
import { generateRandomUsername } from "../utils";
import { SocketConnectionMetadata } from "./socket-connection-metadata";

export const LOBBY_CHANNEL = "lobby";

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

    this.initiateLobbyEventListeners(socket);
    this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
  });
}

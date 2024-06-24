import { GameServer } from ".";
import { generateRandomUsername } from "../utils";
import { LOBBY_CHANNEL, ServerToClientEvent } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", (socket) => {
    const username = generateRandomUsername();
    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(socket.id, new BrowserTabSession(socket.id, username, LOBBY_CHANNEL));

    if (this.socketIdsByUsername.has(username)) {
      const currentSockets = this.socketIdsByUsername.get(username)!;
      currentSockets.push(socket.id);
    } else this.socketIdsByUsername.insert(username, [socket.id]);

    this.disconnectionHandler(socket);
    this.initiateLobbyEventListeners(socket);
    this.initiateGameEventListeners(socket);
    this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
    socket.emit(ServerToClientEvent.ClientUsername, username);
  });
}

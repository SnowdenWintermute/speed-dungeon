import { GameServer } from ".";
import { generateRandomUsername } from "../utils";
import { LOBBY_CHANNEL, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { SocketConnectionMetadata } from "./socket-connection-metadata";

export function connectionHandler(this: GameServer) {
  this.io.of(SocketNamespaces.Main).on("connection", (socket) => {
    const username = generateRandomUsername();
    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(
      socket.id,
      new SocketConnectionMetadata(socket.id, username, LOBBY_CHANNEL)
    );
    this.disconnectionHandler(socket);
    this.initiateLobbyEventListeners(socket);
    this.joinSocketToChannel(socket.id, SocketNamespaces.Main, LOBBY_CHANNEL);
    socket.emit(ServerToClientEvent.ClientUsername, username);
  });

  // this.io.of(SocketNamespaces.Party).on("connection", (socket) => {
  //   console.log("PARTY NAMESPACE: ", socket.id);
  // });
}

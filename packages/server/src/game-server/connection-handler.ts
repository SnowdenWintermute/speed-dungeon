import { GameServer } from "./index.js";
import { generateRandomUsername } from "../utils/index.js";
import { LOBBY_CHANNEL, ServerToClientEvent } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { env } from "../validate-env.js";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", async (socket) => {
    const req = socket.request;
    const cookies = req.headers.cookie;
    let usernameOption;
    let username = "";

    if (cookies) {
      console.log("Cookies received in WebSocket connection:", cookies);
      const res = await fetch(`${env.AUTH_SERVER_URL}/sessions`, {
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      });
      const body = await res.json();
      usernameOption = body["username"];
      if (usernameOption) {
        username = body["username"];
        // they are logged in
        // combine their BrowserTabSession into one username
        // for the list of online players
      }
    }
    if (!username) username = generateRandomUsername();

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

import { GameServer } from "./index.js";
import { generateRandomUsername } from "../utils/index.js";
import { LOBBY_CHANNEL, ServerToClientEvent, UserAuthStatus } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { env } from "../validate-env.js";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", async (socket) => {
    const req = socket.request;
    const cookies = req.headers.cookie;
    let usernameOption;
    let username = "";
    let userAuthStatus = UserAuthStatus.Guest;

    if (cookies) {
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
        userAuthStatus = UserAuthStatus.LoggedIn;
        // this is a logged in user
      }
    }
    if (!username) {
      username = generateRandomUsername();
      // this is a guest
    }

    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(socket.id, new BrowserTabSession(socket.id, username, userAuthStatus));

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

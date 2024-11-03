import { GameServer } from "./index.js";
import { generateRandomUsername } from "../utils/index.js";
import { LOBBY_CHANNEL, ServerToClientEvent } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { env } from "../validate-env.js";
import { applyMiddlewares } from "./event-middleware/index.js";
import disconnectionHandler from "./disconnection-handler.js";
import getSession from "./event-middleware/get-session.js";
import { authenticateUser } from "./authenticate-user.js";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", async (socket) => {
    const req = socket.request;
    let cookies = req.headers.cookie;
    cookies += `; internal=${env.INTERNAL_SERVICES_SECRET};`;

    let [username, userId] = await authenticateUser(cookies, socket);

    // this is a guest
    if (username === null) username = generateRandomUsername();

    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(socket.id, new BrowserTabSession(socket.id, username, userId));

    if (this.socketIdsByUsername.has(username)) {
      const currentSockets = this.socketIdsByUsername.get(username)!;
      currentSockets.push(socket.id);
    } else this.socketIdsByUsername.insert(username, [socket.id]);

    this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
    socket.on("disconnect", applyMiddlewares(getSession)(socket, disconnectionHandler));
    this.initiateLobbyEventListeners(socket);
    this.initiateGameEventListeners(socket);
    this.initiateSavedCharacterListeners(socket);
    socket.emit(ServerToClientEvent.ClientUsername, username);
  });
}

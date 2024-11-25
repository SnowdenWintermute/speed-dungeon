import { GameServer } from "./index.js";
import { LOBBY_CHANNEL, ServerToClientEvent } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { applyMiddlewares } from "./event-middleware/index.js";
import disconnectionHandler from "./disconnection-handler.js";
import getSession from "./event-middleware/get-session.js";
import { getLoggedInUserOrCreateGuest } from "./get-logged-in-user-or-create-guest.js";
import { getLoggedInUserFromSocket } from "./event-middleware/get-logged-in-user-from-socket.js";
import { fetchSavedCharactersHandler } from "./saved-character-event-handlers/fetch-saved-characters-handler.js";
import { generateOneOfEachItem } from "./item-generation/generate-test-items.js";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", async (socket) => {
    const req = socket.request;
    let cookies = req.headers.cookie;

    let { username, userId } = await getLoggedInUserOrCreateGuest(cookies, socket);

    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(socket.id, new BrowserTabSession(socket.id, username, userId));

    if (this.socketIdsByUsername.has(username)) {
      const currentSockets = this.socketIdsByUsername.get(username)!;
      currentSockets.push(socket.id);
    } else this.socketIdsByUsername.insert(username, [socket.id]);
    // try to send their saved characters

    this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
    socket.on("disconnect", applyMiddlewares(getSession)(socket, disconnectionHandler));
    this.initiateLobbyEventListeners(socket);
    this.initiateGameEventListeners(socket);
    this.initiateSavedCharacterListeners(socket);
    socket.emit(ServerToClientEvent.ClientUsername, username);

    const loggedInUserResult = await getLoggedInUserFromSocket(socket);
    if (!(loggedInUserResult instanceof Error)) {
      fetchSavedCharactersHandler(undefined, loggedInUserResult, socket);
    }

    const items = generateOneOfEachItem();
    socket.emit(ServerToClientEvent.TestItems, items);
  });
}

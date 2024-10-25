import { GameServer } from "./index.js";
import { generateRandomUsername } from "../utils/index.js";
import { ERROR_MESSAGES, LOBBY_CHANNEL, ServerToClientEvent } from "@speed-dungeon/common";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { env } from "../validate-env.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { applyMiddlewares } from "./event-middleware/index.js";
import disconnectionHandler from "./disconnection-handler.js";
import getSession from "./event-middleware/get-session.js";

export function connectionHandler(this: GameServer) {
  this.io.of("/").on("connection", async (socket) => {
    const req = socket.request;
    let cookies = req.headers.cookie;
    cookies += `; internal=${env.INTERNAL_SERVICES_SECRET};`;
    let usernameOption;
    let username = "";
    let userId: null | number = null;

    if (cookies) {
      try {
        const res = await fetch(`${env.AUTH_SERVER_URL}/internal/sessions`, {
          method: "GET",
          headers: {
            Cookie: cookies,
          },
        });
        const body = await res.json();
        usernameOption = body["username"];
        const userIdOption = body["userId"];
        if (usernameOption && userIdOption && typeof userIdOption === "number") {
          username = body["username"];
          const userIdAsNumber = userIdOption;
          userId = userIdAsNumber;
          // this is a logged in user
          const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne(
            "ownerId",
            userIdOption
          );
          if (speedDungeonProfileOption === undefined) {
            console.info("creating speed dungeon profile for user");
            await speedDungeonProfilesRepo.insert(userId);
          } else console.info("user has an existing profile");
        }
      } catch (error) {
        socket.emit(ServerToClientEvent.ErrorMessage, "Auth server error");
      }
    }
    if (!username) {
      username = generateRandomUsername();
      // this is a guest
    }

    console.log(`-- ${username} (${socket.id}) connected`);
    this.connections.insert(socket.id, new BrowserTabSession(socket.id, username, userId));

    if (this.socketIdsByUsername.has(username)) {
      const currentSockets = this.socketIdsByUsername.get(username)!;
      currentSockets.push(socket.id);
    } else this.socketIdsByUsername.insert(username, [socket.id]);

    socket.on("disconnect", applyMiddlewares(getSession)(socket, disconnectionHandler));
    this.initiateLobbyEventListeners(socket);
    this.initiateGameEventListeners(socket);
    this.initiateSavedCharacterListeners(socket);
    this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
    socket.emit(ServerToClientEvent.ClientUsername, username);
  });
}

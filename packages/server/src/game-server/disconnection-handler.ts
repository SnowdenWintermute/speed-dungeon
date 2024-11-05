import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  removeFromArray,
} from "@speed-dungeon/common";
import { DisconnectReason, Socket } from "socket.io";
import leaveGameHandler from "./lobby-event-handlers/leave-game-handler.js";
import { getGameServer } from "../singletons.js";
import { BrowserTabSession } from "./socket-connection-metadata.js";
import { getPlayerAssociatedData } from "./event-middleware/get-player-associated-data.js";

export default async function disconnectionHandler(
  reason: DisconnectReason,
  session: BrowserTabSession,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const gameServer = getGameServer();

  console.log(`-- ${session.username} (${socket.id})  disconnected. Reason - ${reason}`);

  const userCurrentSockets = gameServer.socketIdsByUsername.get(session.username);

  if (session.currentGameName) {
    const playerAssociatedDataResult = getPlayerAssociatedData(socket);
    if (playerAssociatedDataResult instanceof Error) return playerAssociatedDataResult;
    const maybeError = await leaveGameHandler(undefined, playerAssociatedDataResult, socket);
    if (maybeError instanceof Error) return maybeError;
  }

  for (const channelName of session.channels) {
    gameServer.removeSocketFromChannel(socket.id, channelName);
  }

  if (userCurrentSockets) removeFromArray(userCurrentSockets, socket.id);
  if (userCurrentSockets && Object.keys(userCurrentSockets).length < 1)
    gameServer.socketIdsByUsername.remove(session.username);

  gameServer.connections.remove(socket.id);
}

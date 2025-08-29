import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { SocketEventNextFunction } from ".";
import { getGameServer } from "../../singletons/index.js";

export default function getSession<T>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: BrowserTabSession | undefined,
  next: SocketEventNextFunction<T, BrowserTabSession>
) {
  const [_, socketMeta] = getGameServer().getConnection(socket.id);
  next(eventData, socketMeta);
}

import {
  ClientToServerEventTypes,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from ".";
import { Socket } from "socket.io";

export default function emitErrorEventIfError(
  this: GameServer,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  fn: () => Error | void
) {
  const maybeError = fn();
  if (maybeError instanceof Error) {
    socket.emit(ServerToClientEvent.ErrorMessage, maybeError.message);
  }
}

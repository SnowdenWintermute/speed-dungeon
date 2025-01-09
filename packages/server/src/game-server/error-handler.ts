import { Socket } from "socket.io";
import { ServerToClientEvent } from "@speed-dungeon/common";

export default function errorHandler(socket: Socket<any, any> | undefined, error: Error) {
  console.trace(error);
  socket?.emit(ServerToClientEvent.ErrorMessage, error.message);
}

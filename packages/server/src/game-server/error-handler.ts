import { Socket } from "socket.io";
import { ServerToClientEvent } from "@speed-dungeon/common";

export default function errorHandler(socket: Socket<any, any> | undefined, errorMessage: string) {
  socket?.emit(ServerToClientEvent.ErrorMessage, errorMessage);
}

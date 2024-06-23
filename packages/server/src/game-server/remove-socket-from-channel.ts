import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from ".";

export default function removeSocketFromChannel(
  this: GameServer,
  socketId: string,
  channelLeaving: null | string
) {
  const namespace = "/";
  const socket = this.io.of(namespace).sockets.get(socketId);

  if (!channelLeaving) return;
  if (socket) socket.leave(channelLeaving);

  const socketMeta = this.connections.get(socketId);
  if (!socketMeta)
    return console.error("tried to remove a socket from a channel but it wasn't registered");

  this.io
    .of(namespace)
    .in(channelLeaving)
    .emit(ServerToClientEvent.UserLeftChannel, socketMeta.username);
}

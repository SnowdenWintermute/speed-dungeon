import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from ".";

export default function joinSocketToChannel(
  this: GameServer,
  socketId: string,
  newChannelName: string
) {
  const namespace = "/";
  const socket = this.io.of(namespace).sockets.get(socketId);
  const socketMeta = this.connections.get(socketId);

  if (!socket || !socketMeta) return;

  this.io.to(newChannelName).emit(ServerToClientEvent.UserJoinedChannel, socketMeta.username);

  socket.join(newChannelName);

  const adapter = this.io.of(namespace).adapter;
  const socketIdsInRoom = adapter.rooms.get(newChannelName);
  const usernamesInRoom: string[] = [];
  if (socketIdsInRoom) {
    socketIdsInRoom.forEach((socketId) => {
      const socketMetaInRoom = this.connections.get(socketId);
      if (socketMetaInRoom) {
        usernamesInRoom.push(socketMetaInRoom.username);
      }
    });
  }

  socket.emit(ServerToClientEvent.ChannelFullUpdate, newChannelName, usernamesInRoom);

  this.io
    .of(namespace)
    .to(newChannelName)
    .emit(ServerToClientEvent.UserJoinedChannel, socketMeta.username);
}

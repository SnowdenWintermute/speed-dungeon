import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from ".";

export default function joinSocketToChannel(
  this: GameServer,
  socketId: string,
  newChannelName: string
) {
  const socket = this.io.sockets.sockets.get(socketId);
  const username = this.connections.get(socketId)?.username;

  if (!socket || !username) return;

  this.io
    .to(newChannelName)
    .emit(ServerToClientEvent.UserJoinedChannel, username);

  socket.join(newChannelName);
  const adapter = this.io.of("/").adapter;
  const socketIdsInRoom = adapter.rooms.get(newChannelName);
  console.log("ids in room: ", socketIdsInRoom);
  const usernamesInRoom: string[] = [];
  if (socketIdsInRoom) {
    socketIdsInRoom.forEach((socketId) => {
      const socketConnectionMetadata = this.connections.get(socketId);
      if (socketConnectionMetadata) {
        console.log("found socket meta: ", socketConnectionMetadata);
        usernamesInRoom.push(socketConnectionMetadata.username);
      }
    });
  }

  console.log("usernames in room: ", usernamesInRoom);

  this.io
    .to(newChannelName)
    .emit(
      ServerToClientEvent.ChannelFullUpdate,
      newChannelName,
      usernamesInRoom
    );
}

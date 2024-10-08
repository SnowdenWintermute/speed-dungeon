import { ServerToClientEvent } from "@speed-dungeon/common";
import { Channel, GameServer } from "./index.js";

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
  if (this.channels[newChannelName] === undefined) this.channels[newChannelName] = new Channel();
  const channel = this.channels[newChannelName] as Channel;
  if (!channel.users[socketMeta.username]) channel.users[socketMeta.username] = {};
  const browserTabSessionsInChannel = channel.users[socketMeta.username];
  if (!browserTabSessionsInChannel)
    return console.error(
      "Expectation failed - browserTabSessionsInChannel was undefined after assignment"
    );
  browserTabSessionsInChannel[socketId] = socketMeta;

  const usernamesInRoom = Object.keys(channel.users);

  socket.emit(ServerToClientEvent.ChannelFullUpdate, newChannelName, usernamesInRoom);
  console.log("sent channel update - ", usernamesInRoom);

  if (Object.keys(browserTabSessionsInChannel).length === 1) {
    // if they already had a browser tab in this channel, don't send a notification
    // because that would lead to duplicate names displayed on the client
    this.io
      .of(namespace)
      .to(newChannelName)
      .emit(ServerToClientEvent.UserJoinedChannel, socketMeta.username);
  }
}

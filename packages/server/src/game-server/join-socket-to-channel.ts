import { ServerToClientEvent, UserChannelDisplayData } from "@speed-dungeon/common";
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

  // this.io
  //   .to(newChannelName)
  //   .emit(
  //     ServerToClientEvent.UserJoinedChannel,
  //     socketMeta.username,
  //     new UserChannelDisplayData(socketMeta.authStatus)
  //   );

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

  const usersInRoom: { username: string; userChannelDisplayData: UserChannelDisplayData }[] = [];

  for (const [username, browserTabSessions] of Object.entries(channel.users)) {
    if (!browserTabSessions) continue;
    const arbitrarySession = Object.values(browserTabSessions)[0];
    if (!arbitrarySession) continue;
    usersInRoom.push({
      username,
      userChannelDisplayData: new UserChannelDisplayData(arbitrarySession.authStatus),
    });
  }

  socket.emit(ServerToClientEvent.ChannelFullUpdate, newChannelName, usersInRoom);

  if (Object.keys(browserTabSessionsInChannel).length === 1) {
    // if they already had a browser tab in this channel, don't send a notification
    // because that would lead to duplicate names displayed on the client
    this.io
      .of(namespace)
      .to(newChannelName)
      .emit(
        ServerToClientEvent.UserJoinedChannel,
        socketMeta.username,
        new UserChannelDisplayData(socketMeta.authStatus)
      );
  }
}

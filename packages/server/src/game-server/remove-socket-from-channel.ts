import { ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "./index.js";

export default function removeSocketFromChannel(
  this: GameServer,
  socketId: string,
  channelLeavingName: null | string
) {
  const namespace = "/";
  const socket = this.io.of(namespace).sockets.get(socketId);

  if (channelLeavingName === null) return;
  if (socket) socket.leave(channelLeavingName);

  const channelLeaving = this.channels[channelLeavingName];
  if (channelLeaving === undefined)
    return console.error("Expectation failed - Socket left a channel that doesn't exist");
  const socketMeta = this.connections.get(socketId);
  if (!socketMeta)
    return console.error("tried to remove a socket from a channel but it wasn't registered");

  const userBrowserSessions = channelLeaving.users[socketMeta.username];
  if (!userBrowserSessions)
    return console.error(
      "Expectation failed - Socket left a channel but we didn't have a matching record in the channels object"
    );
  delete userBrowserSessions[socketId];

  if (Object.keys(userBrowserSessions).length === 0) {
    delete channelLeaving.users[socketMeta.username];
    // since clients only keep a list of usernames and don't care about how many tabs a user has open
    // only notify clients if there are no more connections for this username
    this.io
      .of(namespace)
      .in(channelLeavingName)
      .emit(ServerToClientEvent.UserLeftChannel, socketMeta.username);
  }
}

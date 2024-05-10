import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from ".";

export default function removeSocketFromChannel(
  this: GameServer,
  socketId: string,
  namespace: SocketNamespaces,
  channelLeaving: string
) {
  // leave them from the channel
  console.log(
    "sockets in namseepace ",
    namespace,
    ": ",
    this.io.of(namespace).sockets
  );
  const socket = this.io.of(namespace).sockets.get(socketId);
  if (socket) socket.leave(channelLeaving);

  const socketMeta = this.connections.get(socketId);
  if (!socketMeta)
    return console.error(
      "tried to remove a socket from a channel but it wasn't registered"
    );

  switch (namespace) {
    case SocketNamespaces.Main:
      socketMeta.currentMainChannelName = undefined;
      break;
    case SocketNamespaces.Party:
      socketMeta.currentPartyChannelName = undefined;
      break;
  }

  // emit to the channel that they left
  console.log(
    "emitting to namespace ",
    namespace,
    " and room ",
    channelLeaving,
    " that user left"
  );
  this.io
    .of(namespace)
    .in(channelLeaving)
    .emit(ServerToClientEvent.UserLeftChannel, socketMeta.username);
}

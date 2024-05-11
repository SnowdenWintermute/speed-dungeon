import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from ".";

export default function removeSocketFromChannel(
  this: GameServer,
  socketId: string,
  namespace: SocketNamespaces,
  channelLeaving: null | string
) {
  const socket = this.io.of(namespace).sockets.get(socketId);

  if (!channelLeaving) return;
  if (socket) socket.leave(channelLeaving);

  const socketMeta = this.connections.get(socketId);
  if (!socketMeta)
    return console.error(
      "tried to remove a socket from a channel but it wasn't registered"
    );

  switch (namespace) {
    case SocketNamespaces.Main:
      socketMeta.currentMainChannelName = null;
      break;
    case SocketNamespaces.Party:
      socketMeta.currentPartyChannelName = null;
      break;
  }

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

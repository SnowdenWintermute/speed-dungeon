import {
  Battle,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEventTypes,
  SocketNamespaces,
} from "@speed-dungeon/common";
import { GameServer } from "../..";

export default function handlePartyWipe(
  this: GameServer,
  socketId: string,
  battleOption: null | Battle
) {
  const [socket, socketMeta] = this.getConnection<
    InPartyClientToServerEventTypes,
    InPartyServerToClientEventTypes
  >(socketId, SocketNamespaces.Party);
  if (!socket) return console.error("No socket found");
}

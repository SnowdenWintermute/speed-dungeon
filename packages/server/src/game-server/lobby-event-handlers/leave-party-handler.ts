import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName) return;
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error("No game exists");

  const partyNameLeaving = game.removePlayerFromParty(socketMeta.username);
  if (!partyNameLeaving) throw new Error("Tried to handle a user leaving a party but they didn't know what party they were in");

  this.removeSocketFromChannel(socketId, SocketNamespaces.Party, partyNameLeaving);

  socket?.emit(ServerToClientEvent.PartyNameUpdate, null);
  this.io
    .of(SocketNamespaces.Main)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, null);
}

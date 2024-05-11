import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName) return;
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error("No game exists");

  const partyNameLeaving = game.removePlayerFromParty(socketMeta.username);

  this.removeSocketFromChannel(socketId, SocketNamespaces.Party, partyNameLeaving);

  // emit to the socket that their party is now undefined
  socket?.emit(ServerToClientEvent.PartyNameUpdate, null);
  // emit to the game that a player changed adventuring parties (player: username, partyName: undefined)
  this.io
    .of(SocketNamespaces.Main)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, null);
}

import { ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  try {
    if (!socketMeta.currentGameName) return;
    const game = this.games.get(socketMeta.currentGameName);
    if (!game) throw new Error("No game exists");

    const partyNameLeaving = game.removePlayerFromParty(socketMeta.username);
    if (!partyNameLeaving) return;

    this.removeSocketFromChannel(socketId, SocketNamespaces.Party, partyNameLeaving);

    socket?.emit(ServerToClientEvent.PartyNameUpdate, null);
    this.io
      .of(SocketNamespaces.Main)
      .in(game.name)
      .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, null);
  } catch (error: any) {
    socket?.emit(ServerToClientEvent.ErrorMessage, error.message);
  }
}

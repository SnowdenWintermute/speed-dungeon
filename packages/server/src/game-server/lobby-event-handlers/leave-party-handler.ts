import { ServerToClientEvent, SpeedDungeonGame, getPartyChannelName } from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId);
  try {
    if (!socketMeta.currentGameName) return;
    const game = this.games.get(socketMeta.currentGameName);
    if (!game) return errorHandler(socket, "No game exists");

    const partyNameLeaving = SpeedDungeonGame.removePlayerFromParty(game, socketMeta.username);
    if (!partyNameLeaving) return;

    this.removeSocketFromChannel(socketId, getPartyChannelName(partyNameLeaving));
    socketMeta.currentPartyName = null;

    socket?.emit(ServerToClientEvent.PartyNameUpdate, null);
    this.io
      .of("/")
      .in(game.name)
      .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, null);
  } catch (error: any) {
    socket?.emit(ServerToClientEvent.ErrorMessage, error.message);
  }
}

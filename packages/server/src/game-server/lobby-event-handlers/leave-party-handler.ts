import { ServerToClientEvent, SpeedDungeonGame, getPartyChannelName } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import errorHandler from "../error-handler.js";

export default function leavePartyHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId);
  try {
    if (!socketMeta.currentGameName) return;
    const game = this.games.get(socketMeta.currentGameName);
    if (!game) return errorHandler(socket, "No game exists");

    const partyNameLeaving = SpeedDungeonGame.removePlayerFromParty(game, socketMeta.username);
    if (!partyNameLeaving) return;

    const partyChannelName = getPartyChannelName(game.name, partyNameLeaving);
    this.removeSocketFromChannel(socketId, partyChannelName);
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

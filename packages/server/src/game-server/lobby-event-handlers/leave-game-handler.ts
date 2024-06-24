import { LOBBY_CHANNEL, ServerToClientEvent, SpeedDungeonGame } from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler";

export default function leaveGameHandler(this: GameServer, socketId: string) {
  this.leavePartyHandler(socketId);
  let [socket, socketMeta] = this.getConnection(socketId);
  if (!socketMeta.currentGameName) {
    console.log(
      "Tried to handle a user leaving a game but they didn't know what game they were in"
    );
    return;
  }
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    return errorHandler(
      socket,
      "Tried handle a user leaving a game but the game they thought they were in didn't exist"
    );
  SpeedDungeonGame.removePlayer(game, socketMeta.username);
  const gameNameLeaving = socketMeta.currentGameName;
  socketMeta.currentGameName = null;
  if (Object.keys(game.players).length === 0) this.games.remove(game.name);

  this.removeSocketFromChannel(socketId, gameNameLeaving);
  this.joinSocketToChannel(socketId, LOBBY_CHANNEL);
  socketMeta.channelName = LOBBY_CHANNEL;

  if (this.games.get(gameNameLeaving)) {
    this.io
      .of("/")
      .in(gameNameLeaving)
      .emit(ServerToClientEvent.PlayerLeftGame, socketMeta.username);
  }
  socket?.emit(ServerToClientEvent.GameFullUpdate, null);
}

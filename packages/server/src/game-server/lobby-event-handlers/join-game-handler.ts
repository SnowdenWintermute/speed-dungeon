import { ERROR_MESSAGES, ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { SpeedDungeonPlayer } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";

export default function joinGameHandler(this: GameServer, socketId: string, gameName: string) {
  const [socket, socketMeta] = this.getConnection(socketId);
  console.log("socket tried to join a game");
  if (!socket)
    return errorHandler(socket, "A socket tried to join a game but the socket didn't exist");

  if (socketMeta.currentGameName)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);

  const game = this.games.get(gameName);

  if (!game)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.GAME_DOESNT_EXIST);
  if (game.timeStarted)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED
    );

  game.players[socketMeta.username] = new SpeedDungeonPlayer(socketMeta.username);

  socketMeta.currentGameName = gameName;

  this.removeSocketFromChannel(socketId, socketMeta.channelName);
  this.joinSocketToChannel(socketId, gameName);
  socketMeta.channelName = game.name;

  socket.emit(ServerToClientEvent.GameFullUpdate, game);

  this.io
    .of("/")
    .except(socketId)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerJoinedGame, socketMeta.username);
}

import { ERROR_MESSAGES, GameMode, ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import errorHandler from "../error-handler.js";
import joinProgressionGameHandler from "./join-progression-game-handler.js";
import joinPlayerToGame from "./join-player-to-game.js";

export default async function joinGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string
) {
  const [socket, socketMeta] = this.getConnection(socketId);
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
  if (game.mode === GameMode.Progression)
    joinProgressionGameHandler(this, socketMeta, socket, game);
  else joinPlayerToGame(this, game, socketMeta, socket);
}

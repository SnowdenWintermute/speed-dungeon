import {
  ERROR_MESSAGES,
  ServerToClientEvent,
  SocketNamespaces,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { SpeedDungeonPlayer } from "@speed-dungeon/common";

export default function joinGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string
) {
  const [socket, socketMeta] = this.getConnection(
    socketId,
    SocketNamespaces.Main
  );
  if (!socket)
    throw new Error(
      "A socket tried to join a game but the socket didn't exist"
    );

  if (socketMeta.currentGameName)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME
    );

  const game = this.games.get(gameName);

  if (!game)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.GAME_DOESNT_EXIST
    );
  if (game.timeStarted)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED
    );

  game.players.set(
    socketMeta.username,
    new SpeedDungeonPlayer(socketMeta.username)
  );

  socketMeta.currentGameName = gameName;

  this.removeSocketFromChannel(
    socketId,
    SocketNamespaces.Main,
    socketMeta.currentMainChannelName
  );
  this.joinSocketToChannel(socketId, SocketNamespaces.Main, gameName);

  socket.emit(ServerToClientEvent.GameFullUpdate, game);

  // emit to the game that a new user joined
}
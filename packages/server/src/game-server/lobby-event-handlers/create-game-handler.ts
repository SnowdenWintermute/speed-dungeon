import {
  ERROR_MESSAGES,
  ServerToClientEvent,
  SocketNamespaces,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function createGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string
) {
  const [socket, socketMeta] = this.getConnection(
    socketId,
    SocketNamespaces.Main
  );

  if (socketMeta.currentGameName)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME
    );

  if (this.games.get(gameName))
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.GAME_EXISTS
    );
  console.log(`created game "${gameName}"`);
  this.games.insert(gameName, new SpeedDungeonGame(gameName));
  this.joinGameHandler(socketId, gameName);
}
import {
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { generateRandomGameName } from "../../utils/index.js";

export default function createGameHandler(this: GameServer, socketId: string, gameName: string) {
  const [socket, socketMeta] = this.getConnection(socketId);

  if (socketMeta.currentGameName)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);

  if (this.games.get(gameName))
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.GAME_EXISTS);
  if (gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1) === GAME_CHANNEL_PREFIX)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      `Game name must not start with "${GAME_CHANNEL_PREFIX}"`
    );
  if (gameName === "") gameName = generateRandomGameName();
  console.log(`created game "${gameName}"`);
  this.games.insert(gameName, new SpeedDungeonGame(gameName));
  this.joinGameHandler(socketId, gameName);
}

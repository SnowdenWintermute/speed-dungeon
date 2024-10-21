import {
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { generateRandomGameName } from "../../utils/index.js";
import errorHandler from "../error-handler.js";
import createProgressionGameHandler from "./create-progression-game-handler.js";
import joinGameHandler from "./join-game-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../index.js";

export default async function createGameHandler(
  eventData: { gameName: string; mode: GameMode },
  session: BrowserTabSession,
  socket: Socket
) {
  if (session.currentGameName) return errorHandler(socket, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
  const gameServer = getGameServer();
  let { gameName, mode } = eventData;

  if (gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1) === GAME_CHANNEL_PREFIX)
    return errorHandler(socket, `Game name must not start with "${GAME_CHANNEL_PREFIX}"`);

  if (gameName === "") gameName = generateRandomGameName();
  if (gameServer.games.get(gameName)) return errorHandler(socket, ERROR_MESSAGES.LOBBY.GAME_EXISTS);

  if (mode === GameMode.Progression)
    await createProgressionGameHandler(gameServer, session, socket, gameName);
  else {
    const game = new SpeedDungeonGame(gameName, GameMode.Race, session.username);
    gameServer.games.insert(gameName, game);
    joinGameHandler(gameName, session, socket);
  }
}

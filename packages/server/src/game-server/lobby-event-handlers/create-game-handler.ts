import {
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  MAX_GAME_NAME_LENGTH,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { generateRandomGameName } from "../../utils/index.js";
import errorHandler from "../error-handler.js";
import createProgressionGameHandler from "./create-progression-game-handler.js";
import joinGameHandler from "./join-game-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons.js";
import { idGenerator } from "../../singletons.js";

export default async function createGameHandler(
  eventData: { gameName: string; mode: GameMode; isRanked?: boolean },
  session: BrowserTabSession,
  socket: Socket
) {
  console.log("creating game...");
  if (session.currentGameName) return errorHandler(socket, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
  const gameServer = getGameServer();
  let { gameName, mode, isRanked } = eventData;

  if (isRanked && session.userId === null)
    return errorHandler(socket, ERROR_MESSAGES.AUTH.REQUIRED);

  if (gameName.length > MAX_GAME_NAME_LENGTH)
    return errorHandler(
      socket,
      `Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`
    );

  if (gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1) === GAME_CHANNEL_PREFIX)
    return errorHandler(socket, `Game name must not start with "${GAME_CHANNEL_PREFIX}"`);

  if (gameName === "") gameName = generateRandomGameName();
  if (gameServer.games.get(gameName)) return errorHandler(socket, ERROR_MESSAGES.LOBBY.GAME_EXISTS);

  if (mode === GameMode.Progression)
    await createProgressionGameHandler(gameServer, session, socket, gameName);
  else {
    const game = new SpeedDungeonGame(
      idGenerator.generate(),
      gameName,
      GameMode.Race,
      session.username,
      isRanked
    );
    gameServer.games.insert(gameName, game);
    joinGameHandler(gameName, session, socket);

    console.log("game created");
  }
}

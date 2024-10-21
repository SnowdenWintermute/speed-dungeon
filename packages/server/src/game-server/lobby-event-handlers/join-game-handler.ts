import { ERROR_MESSAGES, GameMode } from "@speed-dungeon/common";
import joinProgressionGameHandler from "./join-progression-game-handler.js";
import joinPlayerToGame from "./join-player-to-game.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";

export default async function joinGameHandler(
  gameName: string,
  session: BrowserTabSession,
  socket: Socket
) {
  const gameServer = getGameServer();
  if (session.currentGameName) return new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);

  const game = gameServer.games.get(gameName);

  if (!game) return new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST);
  if (game.timeStarted) return new Error(ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED);
  if (game.mode === GameMode.Progression)
    joinProgressionGameHandler(gameServer, session, socket, game);
  else joinPlayerToGame(gameServer, game, session, socket);
}

import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import getDefaultSavedCharacterForProgressionGame from "./get-default-saved-character-for-progression-game.js";
import joinPlayerToProgressionGame from "./join-player-to-progression-game.js";

export default async function joinProgressionGameHandler(
  gameServer: GameServer,
  socketMeta: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  game: SpeedDungeonGame
) {
  try {
    const defaultSavedCharacterResult = await getDefaultSavedCharacterForProgressionGame(
      gameServer,
      socketMeta.username,
      socket
    );

    if (defaultSavedCharacterResult instanceof Error)
      return errorHandler(socket, new Error(defaultSavedCharacterResult.message));

    await joinPlayerToProgressionGame(
      gameServer,
      socket,
      socketMeta,
      game,
      defaultSavedCharacterResult
    );
  } catch (error) {
    console.error(error);
    return errorHandler(socket, new Error(ERROR_MESSAGES.SERVER_GENERIC));
  }
}

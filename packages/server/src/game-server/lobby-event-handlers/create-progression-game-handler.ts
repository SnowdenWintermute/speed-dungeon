import {
  AdventuringParty,
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  GameMode,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import getDefaultSavedCharacterForProgressionGame from "./get-default-saved-character-for-progression-game.js";
import joinPlayerToProgressionGame from "./join-player-to-progression-game.js";

export default async function createProgressionGameHandler(
  gameServer: GameServer,
  socketMeta: BrowserTabSession,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  gameName: string
) {
  try {
    const defaultSavedCharacterResult = await getDefaultSavedCharacterForProgressionGame(
      gameServer,
      socketMeta.username,
      socket.id
    );

    if (defaultSavedCharacterResult instanceof Error)
      return errorHandler(socket, defaultSavedCharacterResult.message);

    const game = new SpeedDungeonGame(gameName, GameMode.Progression, socketMeta.username);
    const defaultPartyName = getProgressionGamePartyName(game.name);
    game.adventuringParties[getProgressionGamePartyName(game.name)] = new AdventuringParty(
      defaultPartyName
    );

    gameServer.games.insert(gameName, game);

    await joinPlayerToProgressionGame(
      gameServer,
      socket,
      socketMeta,
      game,
      defaultSavedCharacterResult
    );
  } catch (error) {
    console.error(error);
    return errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
  }
}

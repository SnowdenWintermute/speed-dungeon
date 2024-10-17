import SocketIO from "socket.io";
import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { generateRandomGameName } from "../../utils/index.js";
import { getProgressionGamePartyName } from "./utils.js";
import { fetchSavedCharacters } from "../saved-character-event-handlers/index.js";
import errorHandler from "../error-handler.js";

export default async function createGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string,
  gameMode: GameMode
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  if (!socket) return console.error("Socket not found");

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

  const game = new SpeedDungeonGame(gameName, gameMode, socketMeta.username);
  this.games.insert(gameName, game);

  if (gameMode === GameMode.Progression)
    handleCreateProgressionGame(this, socket, socketMeta.username, game.name);
  else {
    const game = new SpeedDungeonGame(gameName, GameMode.Race, socketMeta.username);
    this.games.insert(gameName, game);
    this.joinGameHandler(socketId, gameName);
  }
}

async function handleCreateProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  username: string,
  gameName: string
) {
  // only let them create a progression game if they have a saved character
  const charactersResult = await fetchSavedCharacters(gameServer, socket.id);
  if (charactersResult instanceof Error)
    return socket.emit(ServerToClientEvent.ErrorMessage, charactersResult.message);
  if (Object.values(charactersResult).length === 0)
    return errorHandler(socket, ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
  const defaultSavedCharacter = charactersResult[0];
  if (defaultSavedCharacter === undefined) {
    console.error("Supposed checked expectation failed");
    return errorHandler(socket, ERROR_MESSAGES.SERVER_GENERIC);
  }

  const game = new SpeedDungeonGame(gameName, GameMode.Progression, username);
  gameServer.games.insert(gameName, game);

  gameServer.joinGameHandler(socket.id, game.name);
  const partyName = getProgressionGamePartyName(game.name);
  gameServer.createPartyHandler(socket.id, partyName);

  // @TODO figure out putting the saved character in the party and alerting others about it
  // party.characters[defaultSavedCharacter.entityProperties.id] = defaultSavedCharacter;
}

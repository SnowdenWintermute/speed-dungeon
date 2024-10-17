import {
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { generateRandomGameName } from "../../utils/index.js";
import errorHandler from "../error-handler.js";
import createProgressionGameHandler from "./create-progression-game-handler.js";

export default async function createGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string,
  gameMode: GameMode
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  if (!socket) return console.error("Socket not found");

  if (socketMeta.currentGameName) return errorHandler(socket, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);

  if (gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1) === GAME_CHANNEL_PREFIX)
    return errorHandler(socket, `Game name must not start with "${GAME_CHANNEL_PREFIX}"`);

  if (gameName === "") gameName = generateRandomGameName();
  if (this.games.get(gameName)) return errorHandler(socket, ERROR_MESSAGES.LOBBY.GAME_EXISTS);

  if (gameMode === GameMode.Progression)
    await createProgressionGameHandler(this, socketMeta, socket, gameName);
  else {
    const game = new SpeedDungeonGame(gameName, GameMode.Race, socketMeta.username);
    this.games.insert(gameName, game);
    this.joinGameHandler(socketId, gameName);
  }
}

// try create progression mode game
// check if this user is logged in
// check if this user is already in a game in any tab to prevent double checkouts of saved characters
// check if this user has any saved characters
// create and join the game
// create and join the default party
// get the first saved character in a filled slot
// add that character to the default party
// alert everyone in that party that the character was added
//
//
// try join progression mode game
// check if this user is logged in
// check if this user is already in a game in any tab to prevent double checkouts of saved characters
// check if the game's player capacity has been met
// check if this user has any saved characters
// join the game
// join the default party
// get the first saved character in a filled slot
// add that character to the default party
// alert everyone in that party that the character was added

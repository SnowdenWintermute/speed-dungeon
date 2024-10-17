import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { GameServer } from "..";
import { fetchSavedCharacters } from "../saved-character-event-handlers/index.js";

export default async function getDefaultSavedCharacterForProgressionGame(
  gameServer: GameServer,
  username: string,
  socketId: string
) {
  try {
    // check if user is in game in any tab, we don't want them loading the same
    // saved character into multiple active games, so we'll just not let them be in
    // a game when trying to join/create a progression game
    const userSocketIds = gameServer.socketIdsByUsername.get(username);
    if (!userSocketIds) return new Error(ERROR_MESSAGES.SERVER_GENERIC);
    for (const socketId of userSocketIds) {
      const socketMeta = gameServer.connections.get(socketId);
      if (!socketMeta) {
        console.error("No connection was registered for gameServer socket");
        return new Error(ERROR_MESSAGES.SERVER_GENERIC);
      }
      if (socketMeta.currentGameName) return new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
    }

    // only let them create/join a progression game if they have a saved character
    const charactersResult = await fetchSavedCharacters(gameServer, socketId);
    if (charactersResult instanceof Error) return new Error(charactersResult.message);
    if (Object.values(charactersResult).length === 0)
      return new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);

    const defaultSavedCharacter = Object.values(charactersResult)[0];
    if (defaultSavedCharacter === undefined) {
      console.error("Supposed checked expectation failed");
      return new Error(ERROR_MESSAGES.SERVER_GENERIC);
    }

    return defaultSavedCharacter;
  } catch (error) {
    console.error(error);
    return new Error(ERROR_MESSAGES.SERVER_GENERIC);
  }
}

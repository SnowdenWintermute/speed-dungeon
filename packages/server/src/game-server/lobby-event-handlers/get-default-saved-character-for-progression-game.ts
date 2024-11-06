import { Combatant, ERROR_MESSAGES } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { fetchSavedCharacters } from "../saved-character-event-handlers/fetch-saved-characters.js";
import { getLoggedInUserFromSocket } from "../event-middleware/get-logged-in-user-from-socket.js";
import { Socket } from "socket.io";

export default async function getDefaultSavedCharacterForProgressionGame(
  gameServer: GameServer,
  username: string,
  socket: Socket
) {
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

  const loggedInUserResult = await getLoggedInUserFromSocket(socket);
  if (loggedInUserResult instanceof Error) return loggedInUserResult;

  // only let them create/join a progression game if they have a saved character
  const charactersResult = await fetchSavedCharacters(loggedInUserResult);
  if (charactersResult instanceof Error) return new Error(charactersResult.message);
  if (Object.values(charactersResult).length === 0)
    return new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);

  let defaultSavedCharacter:
    | {
        combatant: Combatant;
        deepestFloorReached: number;
      }
    | undefined = undefined;

  for (const character of Object.values(charactersResult)) {
    if (character.combatant.combatantProperties.hitPoints > 0) {
      defaultSavedCharacter = character;
      break;
    }
  }

  if (defaultSavedCharacter === undefined)
    return new Error(ERROR_MESSAGES.USER.NO_LIVING_CHARACTERS);

  return defaultSavedCharacter;
}

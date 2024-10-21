import {
  AdventuringParty,
  ERROR_MESSAGES,
  GameMode,
  ServerToClientEvent,
  addCharacterToParty,
} from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";
import { Socket } from "socket.io";
import { fetchSavedCharacters } from "../saved-character-event-handlers/fetch-saved-characters.js";
import { getLoggedInUser } from "../event-middleware/get-logged-in-user.js";

export default async function selectProgressionGameCharacterHandler(
  entityId: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { game, partyOption, player } = playerAssociatedData;
  if (game.mode !== GameMode.Progression) return new Error(ERROR_MESSAGES.GAME.MODE);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const gameServer = getGameServer();

  const loggedInUserResult = await getLoggedInUser(socket);
  if (loggedInUserResult instanceof Error) return loggedInUserResult;
  const charactersResult = await fetchSavedCharacters(loggedInUserResult);

  if (charactersResult instanceof Error) return new Error(charactersResult.message);
  if (Object.values(charactersResult).length === 0)
    return new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);

  // make sure the character exists and is alive
  let savedCharacterOption;
  for (const character of Object.values(charactersResult)) {
    if (character.combatant.entityProperties.id === entityId) {
      if (character.combatant.combatantProperties.hitPoints <= 0)
        return errorHandler(socket, ERROR_MESSAGES.COMBATANT.IS_DEAD);
      savedCharacterOption = character;
      break;
    }
  }
  if (savedCharacterOption === undefined)
    return errorHandler(socket, ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED);

  const characterIdToRemoveOption = player.characterIds[0];
  if (characterIdToRemoveOption === undefined)
    return errorHandler(socket, "Expected to have a selected character but didn't");
  AdventuringParty.removeCharacter(partyOption, characterIdToRemoveOption, player);

  addCharacterToParty(game, player, savedCharacterOption.combatant);
  game.selectedStartingFloor.max = savedCharacterOption.deepestFloorReached;

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(
      ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame,
      player.username,
      savedCharacterOption
    );
}

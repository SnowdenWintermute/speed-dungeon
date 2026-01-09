import { Combatant, ERROR_MESSAGES, GameMode, ServerToClientEvent } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../singletons/index.js";
import { Socket } from "socket.io";
import { fetchSavedCharacters } from "../saved-character-event-handlers/fetch-saved-characters.js";
import { getLoggedInUserFromSocket } from "../event-middleware/get-logged-in-user-from-socket.js";

export async function selectProgressionGameCharacterHandler(
  entityId: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { game, partyOption, player } = playerAssociatedData;
  if (game.mode !== GameMode.Progression) return new Error(ERROR_MESSAGES.GAME.MODE);
  if (partyOption === undefined) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const gameServer = getGameServer();

  const loggedInUserResult = await getLoggedInUserFromSocket(socket);
  if (loggedInUserResult instanceof Error) return loggedInUserResult;
  const charactersResult = await fetchSavedCharacters(loggedInUserResult.profile.id);

  if (charactersResult instanceof Error) return charactersResult;
  if (Object.values(charactersResult).length === 0)
    return new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);

  // make sure the character exists and is alive
  let savedCharacterOption: undefined | { combatant: Combatant; pets: Combatant[] };
  for (const character of Object.values(charactersResult)) {
    if (character.combatant.entityProperties.id === entityId) {
      if (character.combatant.combatantProperties.isDead()) {
        return errorHandler(socket, new Error(ERROR_MESSAGES.COMBATANT.IS_DEAD));
      }
      savedCharacterOption = character;
      break;
    }
  }

  if (savedCharacterOption === undefined) {
    return errorHandler(socket, new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED));
  }

  const characterIdToRemoveOption = player.characterIds[0];
  if (characterIdToRemoveOption === undefined) {
    return errorHandler(socket, new Error("Expected to have a selected character but didn't"));
  }

  const removedChacter = partyOption.removeCharacter(characterIdToRemoveOption, player, game);

  delete game.lowestStartingFloorOptionsBySavedCharacter[removedChacter.getEntityId()];

  game.addCharacterToParty(
    partyOption,
    player,
    savedCharacterOption.combatant,
    savedCharacterOption.pets
  );

  game.lowestStartingFloorOptionsBySavedCharacter[
    savedCharacterOption.combatant.entityProperties.id
  ] = savedCharacterOption.combatant.combatantProperties.deepestFloorReached;
  const maxStartingFloor = game.getMaxStartingFloor();
  if (game.selectedStartingFloor > maxStartingFloor) game.selectedStartingFloor = maxStartingFloor;

  gameServer.io
    .of("/")
    .in(game.getChannelName())
    .emit(ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame, player.username, {
      combatant: savedCharacterOption.combatant.getSerialized(),
      pets: savedCharacterOption.pets.map((pet) => pet.getSerialized()),
    });
}

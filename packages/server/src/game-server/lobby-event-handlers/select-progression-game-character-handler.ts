import {
  AdventuringParty,
  ERROR_MESSAGES,
  ServerToClientEvent,
  addCharacterToParty,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { fetchSavedCharacters } from "../saved-character-event-handlers/index.js";
import errorHandler from "../error-handler.js";

const ATTEMPT_TEXT = "A client tried to select a saved character but";

export default async function selectProgressionGameCharacterHandler(
  this: GameServer,
  socketId: string,
  entityId: string
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  const { currentGameName } = socketMeta;

  if (!currentGameName) {
    console.log(`${ATTEMPT_TEXT} they have no game`);
    return errorHandler(socket, `${ATTEMPT_TEXT} they have no game`);
  }
  const game = this.games.get(currentGameName);
  if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
  const player = game.players[socketMeta.username];
  if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

  try {
    const charactersResult = await fetchSavedCharacters(this, socketId);
    if (charactersResult instanceof Error) return new Error(charactersResult.message);
    if (Object.values(charactersResult).length === 0)
      return new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);

    // make sure the character exists
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

    // remove their currently selected character from the default party
    const partyName = getProgressionGamePartyName(game.name);
    const partyOption = game.adventuringParties[partyName];
    if (!partyOption) return errorHandler(socket, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    const characterIdToRemoveOption = player.characterIds[0];
    if (characterIdToRemoveOption === undefined)
      return errorHandler(socket, "Expected to have a selected character but didn't");
    AdventuringParty.removeCharacter(partyOption, characterIdToRemoveOption, player);
    // add their newly selected character to the party
    addCharacterToParty(game, player, savedCharacterOption.combatant);
    game.selectedStartingFloor.max = savedCharacterOption.deepestFloorReached;
    console.log("selected new character: ", savedCharacterOption.combatant.entityProperties.name);
    // let everyone know about it
    this.io
      .of("/")
      .in(game.name)
      .emit(
        ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame,
        player.username,
        savedCharacterOption
      );
  } catch (error) {
    console.error(error);
  }
}

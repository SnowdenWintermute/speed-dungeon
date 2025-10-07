import { MAX_PARTY_SIZE } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../game/index.js";
import { EntityId } from "../primatives/index.js";
import { AdventuringParty } from "./index.js";

// @REFACTOR - make this a method on the game class

export function addCharacterToParty(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  player: SpeedDungeonPlayer,
  character: Combatant,
  pets: Combatant[]
): EntityId {
  const { combatantManager } = party;

  const partyCharacters = combatantManager.getPartyMemberCombatants();

  const partyIsFull = partyCharacters.length >= MAX_PARTY_SIZE;

  if (partyIsFull) {
    throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);
  }

  const characterId = character.entityProperties.id;

  combatantManager.addCombatant(character);

  party.petManager.setCombatantPets(characterId, pets);

  /// Could move this out of here
  character.combatantProperties.controlledBy.controllerName = player.username;
  player.characterIds.push(characterId);
  game.lowestStartingFloorOptionsBySavedCharacter[characterId] =
    character.combatantProperties.deepestFloorReached;
  ///

  combatantManager.updateHomePositions();

  return characterId;
}

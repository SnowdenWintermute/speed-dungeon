import { MAX_PARTY_SIZE } from "../app-consts.js";
import { Combatant, updateCombatantHomePosition } from "../combatants/index.js";
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
  if (Object.keys(party.characters).length >= MAX_PARTY_SIZE)
    throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);

  const characterId = character.entityProperties.id;

  party.characters[characterId] = character;
  party.characterPositions.push(characterId);

  party.petManager.setCombatantPets(characterId, pets);

  /// Could move this out of here
  character.combatantProperties.controllingPlayer = player.username;
  player.characterIds.push(characterId);
  game.lowestStartingFloorOptionsBySavedCharacter[characterId] =
    character.combatantProperties.deepestFloorReached;
  ///

  for (const character of Object.values(party.characters))
    updateCombatantHomePosition(
      character.entityProperties.id,
      character.combatantProperties,
      party
    );

  return characterId;
}

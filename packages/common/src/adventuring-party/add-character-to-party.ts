import { MAX_PARTY_SIZE } from "../app-consts.js";
import { Combatant, Inventory, updateCombatantHomePosition } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../game/index.js";
import { EntityId } from "../primatives/index.js";
import { CombatantEquipment } from "../combatants/combatant-equipment/index.js";
import { isBrowser } from "../utils/index.js";

export function addCharacterToParty(
  game: SpeedDungeonGame,
  player: SpeedDungeonPlayer,
  character: Combatant
): EntityId {
  const partyName = player.partyName;
  if (!partyName)
    throw new Error(
      "tried to add a character to a party but their controllingPlayer didn't know what party they were in"
    );
  const party = game.adventuringParties[partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  if (Object.keys(party.characters).length >= MAX_PARTY_SIZE)
    throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);

  if (isBrowser()) {
    Inventory.instantiateItemClasses(character.combatantProperties.inventory);
    CombatantEquipment.instatiateItemClasses(character.combatantProperties);
  }

  const characterId = character.entityProperties.id;
  character.combatantProperties.controllingPlayer = player.username;

  party.characters[characterId] = character;
  party.characterPositions.push(characterId);
  player.characterIds.push(characterId);

  game.lowestStartingFloorOptionsBySavedCharacter[characterId] =
    character.combatantProperties.deepestFloorReached;

  for (const character of Object.values(party.characters))
    updateCombatantHomePosition(
      character.entityProperties.id,
      character.combatantProperties,
      party
    );

  return characterId;
}

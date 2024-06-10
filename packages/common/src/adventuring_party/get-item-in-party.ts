import { AdventuringParty } from ".";
import { ERROR_MESSAGES } from "../errors";
import { Item } from "../items";

export function getItemInAdventuringParty(party: AdventuringParty, itemId: string) {
  let toReturn: undefined | Item;

  Object.values(party.characters).forEach((character) => {
    Object.values(character.combatantProperties.equipment).forEach((equippedItem) => {
      if (equippedItem.entityProperties.id === itemId) {
        toReturn = equippedItem;
        return;
      }
    });

    Object.values(character.combatantProperties.inventory.items).forEach((item) => {
      if (item.entityProperties.id === itemId) {
        toReturn = item;
        return;
      }
    });
  });

  Object.values(party.currentRoom.monsters).forEach((monster) => {
    Object.values(monster.combatantProperties.equipment).forEach((equippedItem) => {
      if (equippedItem.entityProperties.id === itemId) {
        toReturn = equippedItem;
        return;
      }
    });

    Object.values(monster.combatantProperties.inventory.items).forEach((item) => {
      if (item.entityProperties.id === itemId) {
        toReturn = item;
        return;
      }
    });
  });

  Object.values(party.currentRoom.items).forEach((item) => {
    if (item.entityProperties.id === itemId) {
      toReturn = item;
      return;
    }
  });

  if (!toReturn) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
  return toReturn;
}

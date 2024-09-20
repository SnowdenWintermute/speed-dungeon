import { AdventuringParty } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Item } from "../items/index.js";

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

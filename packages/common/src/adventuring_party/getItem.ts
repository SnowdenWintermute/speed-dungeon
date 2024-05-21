import { AdventuringParty } from ".";
import { ERROR_MESSAGES } from "../errors";
import Item from "../items";

export default function getItemInAdventuringParty(this: AdventuringParty, itemId: string) {
  let toReturn: undefined | Item;

  Object.values(this.characters).forEach((character) => {
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

  Object.values(this.currentRoom.monsters).forEach((monster) => {
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

  Object.values(this.currentRoom.items).forEach((item) => {
    if (item.entityProperties.id === itemId) {
      toReturn = item;
      return;
    }
  });

  if (!toReturn) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
  return toReturn;
}

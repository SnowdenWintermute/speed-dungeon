import { AdventuringParty } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Item } from "../items/index.js";
import { Inventory } from "../combatants/inventory.js";
import { Combatant, CombatantEquipment } from "../combatants/index.js";

function getItemOnCombatant(combatant: Combatant, itemId: string) {
  let itemOption = Inventory.getItem(combatant.combatantProperties.inventory, itemId);
  if (!(itemOption instanceof Error)) return itemOption;
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatant.combatantProperties);
  for (const equippedItem of equippedItems) {
    if (equippedItem.entityProperties.id === itemId) {
      return equippedItem;
    }
  }
}

export function getItemInAdventuringParty(party: AdventuringParty, itemId: string) {
  let toReturn: undefined | Item;

  for (const combatant of Object.values(party.characters)) {
    toReturn = getItemOnCombatant(combatant, itemId);
    if (toReturn) return toReturn;
  }

  for (const combatant of Object.values(party.currentRoom.monsters)) {
    toReturn = getItemOnCombatant(combatant, itemId);
    if (toReturn) return toReturn;
  }

  for (const item of Object.values(party.currentRoom.items)) {
    if (item.entityProperties.id === itemId) return item;
  }

  return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
}

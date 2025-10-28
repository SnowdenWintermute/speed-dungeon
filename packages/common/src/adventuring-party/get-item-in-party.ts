import { AdventuringParty } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Item } from "../items/index.js";
import { Combatant } from "../combatants/index.js";

function getItemOnCombatant(combatant: Combatant, itemId: string) {
  let itemOption = combatant.combatantProperties.inventory.getItemById(itemId);
  if (!(itemOption instanceof Error)) return itemOption;
  const equippedItems = combatant.combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: true,
  });
  for (const equippedItem of equippedItems) {
    if (equippedItem.entityProperties.id === itemId) {
      return equippedItem;
    }
  }
}

export function getItemInAdventuringParty(party: AdventuringParty, itemId: string) {
  let toReturn: undefined | Item;

  for (const combatant of party.combatantManager.getAllCombatants()) {
    toReturn = getItemOnCombatant(combatant, itemId);
    if (toReturn) return toReturn;
  }

  const maybeItem = party.currentRoom.inventory.getItemById(itemId);
  if (!(maybeItem instanceof Error)) return maybeItem;

  return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
}

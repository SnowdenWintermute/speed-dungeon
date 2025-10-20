export * from "./combatant-is-allowed-to-trade-for-books.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { BookConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import { BOOK_TRADE_ACCEPTED_EQUIPMENT_CHECKERS } from "./book-trade-accepted-equipment-checkers.js";

export function getOwnedAcceptedItemsForBookTrade(
  combatantProperties: CombatantProperties,
  bookType: BookConsumableType
): Equipment[] {
  const toReturn = [];
  // look at all broken items equipped and in inventory
  const equipmentInInventory = CombatantProperties.getOwnedEquipment(combatantProperties);
  const equippedItems = combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: true,
  });

  const ownedEquipment = [...equipmentInInventory, ...equippedItems];

  // check the affixes / stats on those items to match the consumable type
  for (const equipment of ownedEquipment) {
    // make sure it is broken
    if (!Equipment.isBroken(equipment)) continue;
    // check if it has the properties required for this book trade
    const equipmentAcceptedChecker = BOOK_TRADE_ACCEPTED_EQUIPMENT_CHECKERS[bookType];
    const isAccepted = equipmentAcceptedChecker(equipment);
    if (!isAccepted) continue;
    toReturn.push(equipment);
  }

  return toReturn;
}

export function getBookLevelForTrade(levelOfItemTrading: number, vendingMachineLevel: number) {
  const vmLevelLimiter = Math.floor(vendingMachineLevel / 2);
  const bookLevel = Math.min(levelOfItemTrading, vmLevelLimiter);
  return bookLevel;
}

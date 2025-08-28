import { CombatantEquipment, CombatantProperties } from "../../combatants/index.js";
import { BookConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import { BOOK_TRADE_ACCEPTED_EQUIPMENT_CHECKERS } from "./book-trade-accepted-equipment-checkers.js";

export function getOwnedAcceptedItemsForBookTrade(
  combatantProperties: CombatantProperties,
  bookType: BookConsumableType,
  vendingMachineLevel: number
): { equipment: Equipment; bookLevel: number }[] {
  const toReturn = [];
  // look at all broken items equipped and in inventory
  const equipmentInInventory = CombatantProperties.getOwnedEquipment(combatantProperties);
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
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
    const bookLevel = Math.min(vendingMachineLevel, equipment.itemLevel);
    toReturn.push({ equipment, bookLevel });
  }

  return toReturn;
}

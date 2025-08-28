import { CombatantEquipment, CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";

export function getOwnedAcceptedItemsForBookTrade(
  combatantProperties: CombatantProperties,
  consumableType: ConsumableType,
  vendingMachineLevel: number
): { equipment: Equipment; bookLevel: number }[] {
  const toReturn = [];
  // look at all broken items equipped and in inventory
  const equipmentInInventory = CombatantProperties.getOwnedEquipment(combatantProperties);
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
    includeUnselectedHotswapSlots: true,
  });

  // check the affixes / stats on those items to match the consumable type
  for (const equipment of equipmentInInventory) {
    // make sure it is broken
    if (!Equipment.isBroken(equipment)) continue;
    // check if it has the properties required for this book trade
  }

  // return list of accepted items and book level to offer
  // > Math.min(equipment.itemLevel, vendingMachine.level)
  return [];
}

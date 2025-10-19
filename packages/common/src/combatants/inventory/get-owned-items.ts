import { CombatantProperties } from "../index.js";

export function getOwnedEquipment(combatantProperties: CombatantProperties) {
  const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: true,
  });
  return combatantProperties.inventory.equipment.concat(allEquippedItems);
}

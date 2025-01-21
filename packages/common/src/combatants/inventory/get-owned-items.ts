import { CombatantEquipment } from "../combatant-equipment/index.js";
import { CombatantProperties } from "../index.js";

export function getOwnedEquipment(combatantProperties: CombatantProperties) {
  const allEquippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
    includeUnselectedHotswapSlots: true,
  });
  return combatantProperties.inventory.equipment.concat(allEquippedItems);
}

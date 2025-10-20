import { CombatantProperties } from "../combatant-properties";

export function getOwnedEquipment(combatantProperties: CombatantProperties) {
  const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
    includeUnselectedHotswapSlots: true,
  });
  return combatantProperties.inventory.equipment.concat(allEquippedItems);
}

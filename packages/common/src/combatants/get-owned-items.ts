import { CombatantEquipment } from "./combatant-equipment/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export function getOwnedEquipment(combatantProperties: CombatantProperties) {
  const allEquippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties);
  return combatantProperties.inventory.equipment.concat(allEquippedItems);
}

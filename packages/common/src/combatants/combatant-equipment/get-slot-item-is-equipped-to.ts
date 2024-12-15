import { EquipmentSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getSlotItemIsEquippedTo(
  combatantProperties: CombatantProperties,
  itemId: string
): null | EquipmentSlot {
  for (const [slotKey, itemOption] of Object.entries(combatantProperties.equipment)) {
    const slot = parseInt(slotKey) as EquipmentSlot;
    if (itemOption?.entityProperties.id === itemId) return slot;
  }
  return null;
}

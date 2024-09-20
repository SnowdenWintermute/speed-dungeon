import { EquipmentSlot } from "../items/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function unequipSlots(
  combatantProperties: CombatantProperties,
  slots: EquipmentSlot[]
) {
  const unequippedItemIds: string[] = [];

  for (const slot of slots) {
    const itemOption = combatantProperties.equipment[slot];
    if (itemOption !== undefined) {
      combatantProperties.inventory.items.push(itemOption);
      unequippedItemIds.push(itemOption.entityProperties.id);
      delete combatantProperties.equipment[slot];
    }
  }

  CombatantProperties.clampHpAndMpToMax(combatantProperties);

  return unequippedItemIds;
}

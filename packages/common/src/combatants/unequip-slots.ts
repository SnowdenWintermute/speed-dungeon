import { EquipmentSlot } from "../items";
import { CombatantProperties } from "./combatant-properties";

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

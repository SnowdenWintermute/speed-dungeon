import { TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "../index.js";
import { applyEquipmentEffectWhileMaintainingResourcePercentages } from "./apply-equipment-affect-while-maintaining-resource-percentages.js";

export function unequipSlots(
  combatantProperties: CombatantProperties,
  slots: TaggedEquipmentSlot[]
) {
  const unequippedItemIds: string[] = [];

  applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
    const unequippedItems = combatantProperties.equipment.unequipSlots(slots);
    combatantProperties.inventory.equipment.push(...unequippedItems);
    unequippedItemIds.push(...unequippedItems.map((item) => item.entityProperties.id));
  });
  return unequippedItemIds;
}

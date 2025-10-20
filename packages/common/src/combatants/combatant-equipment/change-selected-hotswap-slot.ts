import { CombatantProperties } from "../combatant-properties.js";
import { applyEquipmentEffectWhileMaintainingResourcePercentages } from "../index.js";

export function changeSelectedHotswapSlot(
  combatantProperties: CombatantProperties,
  slotIndex: number
) {
  applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
    combatantProperties.equipment.setSelectedHoldableSlotIndex(slotIndex);
  });
}

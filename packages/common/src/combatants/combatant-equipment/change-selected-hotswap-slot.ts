import {
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  CombatantProperties,
} from "../index.js";

export function changeSelectedHotswapSlot(
  combatantProperties: CombatantProperties,
  slotIndex: number
) {
  applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
    combatantProperties.equipment.equippedHoldableHotswapSlotIndex = slotIndex;
  });
}

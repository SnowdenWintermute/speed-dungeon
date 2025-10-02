import { Equipment } from "../../items/equipment/index.js";
import { EquipmentSlotType, TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "../index.js";
import { applyEquipmentEffectWhileMaintainingResourcePercentages } from "./apply-equipment-affect-while-maintaining-resource-percentages.js";
import { CombatantEquipment } from "./index.js";

export function unequipSlots(
  combatantProperties: CombatantProperties,
  slots: TaggedEquipmentSlot[]
) {
  const unequippedItemIds: string[] = [];

  applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
    for (const slot of slots) {
      let itemOption: Equipment | undefined;

      switch (slot.type) {
        case EquipmentSlotType.Holdable:
          const equippedHoldableHotswapSlot = CombatantEquipment.getEquippedHoldableSlots(
            combatantProperties.equipment
          );
          if (!equippedHoldableHotswapSlot) continue;
          itemOption = equippedHoldableHotswapSlot.holdables[slot.slot];
          delete equippedHoldableHotswapSlot.holdables[slot.slot];
          break;
        case EquipmentSlotType.Wearable:
          itemOption = combatantProperties.equipment.wearables[slot.slot];
          delete combatantProperties.equipment.wearables[slot.slot];
          break;
      }
      if (itemOption === undefined) continue;

      combatantProperties.inventory.equipment.push(itemOption);
      unequippedItemIds.push(itemOption.entityProperties.id);
    }
  });

  return unequippedItemIds;
}

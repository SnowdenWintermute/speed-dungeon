import { EquipmentSlotType, TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantProperties } from "../index.js";
import { CombatantEquipment } from "./index.js";

export function getSlotItemIsEquippedTo(
  combatantProperties: CombatantProperties,
  itemId: string
): null | TaggedEquipmentSlot {
  for (const [slot, item] of iterateNumericEnumKeyedRecord(
    combatantProperties.equipment.wearables
  )) {
    if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Wearable, slot };
  }

  const holdableSlotsOption = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!holdableSlotsOption) return null;

  for (const [slot, item] of iterateNumericEnumKeyedRecord(holdableSlotsOption.holdables)) {
    if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Holdable, slot };
  }

  return null;
}

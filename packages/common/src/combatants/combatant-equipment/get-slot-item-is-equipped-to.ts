import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";
import { CombatantEquipment } from "./index.js";

export function getSlotItemIsEquippedTo(
  combatantProperties: CombatantProperties,
  itemId: string
): null | TaggedEquipmentSlot {
  for (const [slotKey, item] of Object.entries(combatantProperties.equipment.wearables)) {
    const slot = parseInt(slotKey) as WearableSlotType;
    if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Wearable, slot };
  }

  const holdableSlotsOption = CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!holdableSlotsOption) return null;

  for (const [slotKey, item] of Object.entries(holdableSlotsOption.holdables)) {
    const slot = parseInt(slotKey) as HoldableSlotType;
    if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Holdable, slot };
  }

  return null;
}

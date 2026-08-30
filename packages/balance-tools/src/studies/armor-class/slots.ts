import { EquipmentSlotId } from "@speed-dungeon/common";

/** the three places armor class can be worn; everything else reports none of it */
export const ARMOR_CLASS_SLOT_IDS = [
  EquipmentSlotId.Head,
  EquipmentSlotId.Body,
  EquipmentSlotId.OffHand,
] as const;

export type ArmorClassSlotId = (typeof ARMOR_CLASS_SLOT_IDS)[number];

export function armorClassSlotRecord<T>(
  valueOf: (slotId: ArmorClassSlotId) => T
): Record<ArmorClassSlotId, T> {
  return {
    [EquipmentSlotId.Head]: valueOf(EquipmentSlotId.Head),
    [EquipmentSlotId.Body]: valueOf(EquipmentSlotId.Body),
    [EquipmentSlotId.OffHand]: valueOf(EquipmentSlotId.OffHand),
  };
}

import {
  Equipment,
  TaggedEquipmentSlot,
  EquipmentType,
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "@speed-dungeon/common";
import isEqual from "lodash.isequal";

export default function shouldDisplayModTooltip(
  comparedSlot: null | TaggedEquipmentSlot,
  equippedItem: Equipment
): boolean {
  if (
    !isEqual(comparedSlot, { type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingR }) &&
    !isEqual(comparedSlot, { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand })
  )
    return false;

  const equipmentType = equippedItem.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType;
  if (equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.OneHandedMeleeWeapon)
    return true;
  return false;
}

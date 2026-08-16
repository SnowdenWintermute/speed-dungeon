import { Equipment, EquipmentSlotId, EquipmentType } from "@speed-dungeon/common";

export default function shouldDisplayModTooltip(
  comparedSlotId: null | EquipmentSlotId,
  equippedItem: Equipment
): boolean {
  if (
    !(comparedSlotId === EquipmentSlotId.FingerMain) &&
    !(comparedSlotId === EquipmentSlotId.MainHand)
  ) {
    return false;
  }

  const equipmentType = equippedItem.equipmentBaseItemProperties.equipmentType;
  if (
    equipmentType === EquipmentType.Ring ||
    equipmentType === EquipmentType.OneHandedMeleeWeapon
  ) {
    return true;
  }
  return false;
}

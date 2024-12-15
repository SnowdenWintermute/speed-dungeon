import { Equipment, EquipmentSlot, EquipmentType } from "@speed-dungeon/common";

export default function shouldDisplayModTooltip(
  comparedSlot: null | EquipmentSlot,
  equippedItem: Equipment
): boolean {
  if (comparedSlot !== EquipmentSlot.RingR && comparedSlot !== EquipmentSlot.MainHand) return false;

  const equipmentType = equippedItem.equipmentBaseItemProperties.type;
  if (equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.OneHandedMeleeWeapon)
    return true;
  return false;
}

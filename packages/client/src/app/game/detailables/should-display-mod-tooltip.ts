import { EquipmentSlot, EquipmentType, Item, ItemPropertiesType } from "@speed-dungeon/common";

export default function shouldDisplayModTooltip(
  comparedSlot: null | EquipmentSlot,
  equippedItem: Item
): boolean {
  if (comparedSlot !== EquipmentSlot.RingR && comparedSlot !== EquipmentSlot.MainHand) return false;
  if (equippedItem.itemProperties.type === ItemPropertiesType.Consumable) return false;
  const equipmentType =
    equippedItem.itemProperties.equipmentProperties.equipmentBaseItemProperties.type;
  if (equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.OneHandedMeleeWeapon)
    return true;
  return false;
}

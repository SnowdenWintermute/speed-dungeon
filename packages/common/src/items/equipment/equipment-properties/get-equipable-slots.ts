import { EquipmentProperties } from ".";
import { EquipmentType } from "../equipment-types";
import { EquipmentSlot } from "../slots";

export interface EquipableSlots {
  main: EquipmentSlot;
  alternate: null | EquipmentSlot;
}

export default function getEquipableSlots(equipmentProperties: EquipmentProperties) {
  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
      return { main: EquipmentSlot.Body, alternate: null };
    case EquipmentType.HeadGear:
      return { main: EquipmentSlot.Head, alternate: null };
    case EquipmentType.Ring:
      return { main: EquipmentSlot.RingR, alternate: EquipmentSlot.RingR };
    case EquipmentType.Amulet:
      return { main: EquipmentSlot.Amulet, alternate: null };
    case EquipmentType.OneHandedMeleeWeapon:
      return { main: EquipmentSlot.MainHand, alternate: EquipmentSlot.OffHand };
    case EquipmentType.TwoHandedMeleeWeapon:
      return { main: EquipmentSlot.MainHand, alternate: null };
    case EquipmentType.TwoHandedRangedWeapon:
      return { main: EquipmentSlot.MainHand, alternate: null };
    case EquipmentType.Shield:
      return { main: EquipmentSlot.OffHand, alternate: null };
  }
}

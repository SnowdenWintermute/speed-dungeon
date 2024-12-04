import { EquipmentProperties } from "./equipment-properties/index.js";
import { EquipmentType } from "./equipment-types/index.js";

export enum WeaponSlot {
  MainHand,
  OffHand,
}

export enum EquipmentSlot {
  Head,
  Body,
  MainHand,
  OffHand,
  RingL,
  RingR,
  Amulet,
}

export function formatEquipmentSlot(slot: EquipmentSlot) {
  switch (slot) {
    case EquipmentSlot.Head:
      return "Head";
    case EquipmentSlot.Body:
      return "Body";
    case EquipmentSlot.MainHand:
      return "MainHand";
    case EquipmentSlot.OffHand:
      return "OffHand";
    case EquipmentSlot.RingL:
      return "RingL";
    case EquipmentSlot.RingR:
      return "RingR";
    case EquipmentSlot.Amulet:
      return "Amulet";
  }
}

export interface EquipableSlots {
  main: EquipmentSlot;
  alternate: null | EquipmentSlot;
}

export function getEquipableSlots(equipmentProperties: EquipmentProperties): EquipableSlots {
  switch (equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
      return { main: EquipmentSlot.Body, alternate: null };
    case EquipmentType.HeadGear:
      return { main: EquipmentSlot.Head, alternate: null };
    case EquipmentType.Ring:
      return { main: EquipmentSlot.RingR, alternate: EquipmentSlot.RingL };
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

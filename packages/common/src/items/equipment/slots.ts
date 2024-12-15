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

export const EQUIPMENT_SLOT_STRINGS: Record<EquipmentSlot, string> = {
  [EquipmentSlot.Head]: "Head",
  [EquipmentSlot.Body]: "Body",
  [EquipmentSlot.RingL]: "RingL",
  [EquipmentSlot.RingR]: "RingR",
  [EquipmentSlot.Amulet]: "Amulet",
  [EquipmentSlot.MainHand]: "MainHand",
  [EquipmentSlot.OffHand]: "OffHand",
};

export interface EquipableSlots {
  main: EquipmentSlot;
  alternate: null | EquipmentSlot;
}

export const EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE: Record<
  EquipmentType,
  { main: EquipmentSlot; alternate: null | EquipmentSlot }
> = {
  [EquipmentType.BodyArmor]: { main: EquipmentSlot.Body, alternate: null },
  [EquipmentType.HeadGear]: { main: EquipmentSlot.Head, alternate: null },
  [EquipmentType.Ring]: { main: EquipmentSlot.RingR, alternate: EquipmentSlot.RingL },
  [EquipmentType.Amulet]: { main: EquipmentSlot.Amulet, alternate: null },
  [EquipmentType.OneHandedMeleeWeapon]: {
    main: EquipmentSlot.MainHand,
    alternate: EquipmentSlot.OffHand,
  },
  [EquipmentType.TwoHandedMeleeWeapon]: { main: EquipmentSlot.MainHand, alternate: null },
  [EquipmentType.TwoHandedRangedWeapon]: { main: EquipmentSlot.MainHand, alternate: null },
  [EquipmentType.Shield]: { main: EquipmentSlot.OffHand, alternate: null },
};

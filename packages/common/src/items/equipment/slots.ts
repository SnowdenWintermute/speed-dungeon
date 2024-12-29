import { EquipmentType } from "./equipment-types/index.js";

export enum EquipmentSlotType {
  Holdable,
  Wearable,
}

export enum HoldableSlotType {
  MainHand,
  OffHand,
}

export enum WearableSlotType {
  Head,
  Body,
  RingL,
  RingR,
  Amulet,
}

export interface HoldableSlot {
  type: EquipmentSlotType.Holdable;
  slot: HoldableSlotType;
}
export interface WearableSlot {
  type: EquipmentSlotType.Wearable;
  slot: WearableSlotType;
}

export type TaggedEquipmentSlot = HoldableSlot | WearableSlot;

export const WEARABLE_SLOT_STRINGS: Record<WearableSlotType, string> = {
  [WearableSlotType.Head]: "Head",
  [WearableSlotType.Body]: "Body",
  [WearableSlotType.RingL]: "RingL",
  [WearableSlotType.RingR]: "RingR",
  [WearableSlotType.Amulet]: "Amulet",
};

export const HOLDABLE_SLOT_STRINGS: Record<HoldableSlotType, string> = {
  [HoldableSlotType.MainHand]: "MainHand",
  [HoldableSlotType.OffHand]: "OffHand",
};

export interface EquipableSlots {
  main: TaggedEquipmentSlot;
  alternate: null | TaggedEquipmentSlot;
}

export const EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE: Record<EquipmentType, EquipableSlots> = {
  [EquipmentType.BodyArmor]: {
    main: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Body },
    alternate: null,
  },
  [EquipmentType.HeadGear]: {
    main: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Head },
    alternate: null,
  },
  [EquipmentType.Ring]: {
    main: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingR },
    alternate: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.RingL },
  },
  [EquipmentType.Amulet]: {
    main: { type: EquipmentSlotType.Wearable, slot: WearableSlotType.Amulet },
    alternate: null,
  },
  [EquipmentType.OneHandedMeleeWeapon]: {
    main: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
    alternate: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
  },
  [EquipmentType.TwoHandedMeleeWeapon]: {
    main: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
    alternate: null,
  },
  [EquipmentType.TwoHandedRangedWeapon]: {
    main: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
    alternate: null,
  },
  [EquipmentType.Shield]: {
    main: { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
    alternate: null,
  },
};

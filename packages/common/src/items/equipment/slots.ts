import { EQUIPMENT_TYPE_STRINGS, EquipmentType } from "./equipment-types/index.js";

export enum EquipmentSlotType {
  Holdable,
  Wearable,
}

export const EQUIPMENT_SLOT_TYPE_STRINGS: Record<EquipmentSlotType, string> = {
  [EquipmentSlotType.Holdable]: "Holdable",
  [EquipmentSlotType.Wearable]: "Wearable",
};

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
  [HoldableSlotType.MainHand]: "main hand",
  [HoldableSlotType.OffHand]: "offhand",
};

export interface EquipableSlots {
  main: TaggedEquipmentSlot;
  alternate: null | TaggedEquipmentSlot;
}

export function validateEquipmentSlot(equipmentType: EquipmentType, slot: TaggedEquipmentSlot) {
  const equipableSlots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];

  const matchesMain =
    equipableSlots.main.type === slot.type && equipableSlots.main.slot === slot.slot;
  const matchesAlternate =
    equipableSlots.alternate !== null &&
    equipableSlots.alternate.type === slot.type &&
    equipableSlots.alternate.slot === slot.slot;

  if (!matchesMain && !matchesAlternate) {
    const slotName =
      slot.type === EquipmentSlotType.Wearable
        ? WEARABLE_SLOT_STRINGS[slot.slot]
        : HOLDABLE_SLOT_STRINGS[slot.slot];
    throw new Error(
      `${EQUIPMENT_TYPE_STRINGS[equipmentType]} cannot be equipped in ${slotName} slot`
    );
  }
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

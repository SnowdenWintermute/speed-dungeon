import cloneDeep from "lodash.clonedeep";
import {
  EquipmentSlotId,
  EquipmentSlotTypeNew,
  HOLDABLE_SLOT_TYPES,
  HoldableSlotType,
} from "../../combatants/combatant-equipment/slots.js";
import { EQUIPMENT_TYPE_STRINGS, EquipmentType } from "./equipment-types/index.js";

export enum EquipmentSlotType {
  Holdable,
  Wearable,
}

export const EQUIPMENT_SLOT_TYPE_STRINGS: Record<EquipmentSlotType, string> = {
  [EquipmentSlotType.Holdable]: "Holdable",
  [EquipmentSlotType.Wearable]: "Wearable",
};

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

export const ALL_HOLDABLE_SLOTS: HoldableSlot[] = cloneDeep(HOLDABLE_SLOT_TYPES)
  .filter((value): value is HoldableSlotType => typeof value === "number")
  .map((slot) => ({
    type: EquipmentSlotType.Holdable,
    slot,
  }));

export const ALL_WEARABLE_SLOTS: WearableSlot[] = Object.values(WearableSlotType)
  .filter((value): value is WearableSlotType => typeof value === "number")
  .map((slot) => ({
    type: EquipmentSlotType.Wearable,
    slot,
  }));

export const ALL_EQUIPMENT_SLOTS = [...ALL_HOLDABLE_SLOTS, ...ALL_WEARABLE_SLOTS];

export type TaggedEquipmentSlot = HoldableSlot | WearableSlot;

export const WEARABLE_SLOT_STRINGS: Record<WearableSlotType, string> = {
  [WearableSlotType.Head]: "Head",
  [WearableSlotType.Body]: "Body",
  [WearableSlotType.RingL]: "RingL",
  [WearableSlotType.RingR]: "RingR",
  [WearableSlotType.Amulet]: "Amulet",
};

export const HOLDABLE_SLOT_STRINGS: Record<HoldableSlotType, string> = {
  [EquipmentSlotTypeNew.Mainhand]: "main hand",
  [EquipmentSlotTypeNew.Offhand]: "offhand",
};

export interface EquipableSlots {
  main: EquipmentSlotId;
  alternate?: EquipmentSlotId;
}

export function validateEquipmentSlot(equipmentType: EquipmentType, slot: TaggedEquipmentSlot) {
  if (!equipmentTypeCanGoInSlot(equipmentType, slot)) {
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
    main: EquipmentSlotId.Body,
  },
  [EquipmentType.HeadGear]: {
    main: EquipmentSlotId.Head,
  },
  [EquipmentType.Ring]: {
    main: EquipmentSlotId.FingerMain,
    alternate: EquipmentSlotId.FingerAlternate,
  },
  [EquipmentType.Amulet]: {
    main: EquipmentSlotId.Neck,
  },
  [EquipmentType.OneHandedMeleeWeapon]: {
    main: EquipmentSlotId.MainHand,
    alternate: EquipmentSlotId.OffHand,
  },
  [EquipmentType.TwoHandedMeleeWeapon]: {
    main: EquipmentSlotId.MainHand,
  },
  [EquipmentType.TwoHandedRangedWeapon]: {
    main: EquipmentSlotId.MainHand,
  },
  [EquipmentType.Shield]: {
    main: EquipmentSlotId.OffHand,
  },
};

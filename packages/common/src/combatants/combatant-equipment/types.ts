import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { iterateNumericEnum } from "../../utils/index.js";

export enum EquipmentSlotType {
  Head,
  Body,
  Finger,
  Neck,
  MainHand,
  OffHand,
}

export enum EquipmentSlotId {
  Head,
  Body,
  FingerMain,
  FingerAlternate,
  Neck,
  MainHand,
  OffHand,
}

export const EQUIPMENT_SLOT_ID_STRINGS: Record<EquipmentSlotId, string> = {
  [EquipmentSlotId.Head]: "Head",
  [EquipmentSlotId.Body]: "Body",
  [EquipmentSlotId.FingerMain]: "Finger Main",
  [EquipmentSlotId.FingerAlternate]: "Finger Alternate",
  [EquipmentSlotId.Neck]: "Neck",
  [EquipmentSlotId.MainHand]: "Main Hand",
  [EquipmentSlotId.OffHand]: "Offhand",
};

export const SLOT_TYPE_BY_SLOT_ID: Record<EquipmentSlotId, EquipmentSlotType> = {
  [EquipmentSlotId.Head]: EquipmentSlotType.Head,
  [EquipmentSlotId.Body]: EquipmentSlotType.Body,
  [EquipmentSlotId.FingerMain]: EquipmentSlotType.Finger,
  [EquipmentSlotId.FingerAlternate]: EquipmentSlotType.Finger,
  [EquipmentSlotId.Neck]: EquipmentSlotType.Neck,
  [EquipmentSlotId.MainHand]: EquipmentSlotType.MainHand,
  [EquipmentSlotId.OffHand]: EquipmentSlotType.OffHand,
};

export const WEARABLE_SLOT_IDS = [
  EquipmentSlotId.Head,
  EquipmentSlotId.Body,
  EquipmentSlotId.FingerMain,
  EquipmentSlotId.FingerAlternate,
  EquipmentSlotId.Neck,
] as const;

export type WearableSlotId = (typeof WEARABLE_SLOT_IDS)[number];

export const HOLDABLE_SLOT_IDS = [EquipmentSlotId.MainHand, EquipmentSlotId.OffHand] as const;

export type HoldableSlotId = (typeof HOLDABLE_SLOT_IDS)[number];

export const COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE: Record<
  EquipmentType,
  { main: EquipmentSlotId; alternate?: EquipmentSlotId }
> = {
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

const HOLDABLE_SLOT_ID_SET: Set<EquipmentSlotId> = new Set(HOLDABLE_SLOT_IDS);

export const HOLDABLE_EQUIPMENT_TYPES = iterateNumericEnum(EquipmentType).filter(
  (equipmentType) => {
    const { main, alternate } = COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE[equipmentType];
    return (
      HOLDABLE_SLOT_ID_SET.has(main) ||
      (alternate !== undefined && HOLDABLE_SLOT_ID_SET.has(alternate))
    );
  }
);

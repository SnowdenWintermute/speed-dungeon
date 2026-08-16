import { EquipmentType } from "../../items/equipment/equipment-types";

export enum EquipmentSlotTypeNew {
  Head,
  Body,
  Finger,
  Neck,
  Mainhand,
  Offhand,
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
    main: EquipmentSlotId.MainHand,
    alternate: EquipmentSlotId.OffHand,
  },
};

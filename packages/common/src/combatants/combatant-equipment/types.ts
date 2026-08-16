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

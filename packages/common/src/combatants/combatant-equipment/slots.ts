import cloneDeep from "lodash.clonedeep";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";

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

const COMPATIBLE_ITEMS_BY_SLOT_TYPE: Record<EquipmentSlotTypeNew, EquipmentType[]> = {
  [EquipmentSlotTypeNew.Head]: [EquipmentType.HeadGear],
  [EquipmentSlotTypeNew.Body]: [EquipmentType.BodyArmor],
  [EquipmentSlotTypeNew.Finger]: [EquipmentType.Ring],
  [EquipmentSlotTypeNew.Neck]: [EquipmentType.Amulet],
  [EquipmentSlotTypeNew.Mainhand]: [
    EquipmentType.OneHandedMeleeWeapon,
    EquipmentType.TwoHandedMeleeWeapon,
    EquipmentType.TwoHandedRangedWeapon,
  ],
  [EquipmentSlotTypeNew.Offhand]: [EquipmentType.OneHandedMeleeWeapon, EquipmentType.Shield],
};

export class EquipmentSlot implements Serializable, ReactiveNode {
  constructor(
    public readonly type: EquipmentSlotTypeNew,
    private _equipmentInSlot: null | Equipment
  ) {}

  toSerialized() {
    return { type: this.type, _equipmentInSlot: this._equipmentInSlot };
  }

  static fromSerialized(serialized: SerializedOf<EquipmentSlot>) {
    return new EquipmentSlot(serialized.type, serialized._equipmentInSlot);
  }

  makeObservable(): void {
    throw new Error("Method not implemented.");
  }

  getCompatibleEquipmentTypes() {
    return COMPATIBLE_ITEMS_BY_SLOT_TYPE[this.type];
  }

  canAcceptEquipmentType(equipmentType: EquipmentType) {
    return this.getCompatibleEquipmentTypes().includes(equipmentType);
  }

  get equipmentInSlot() {
    return cloneDeep(this._equipmentInSlot);
  }

  set equipmentInSlot(equipment: Equipment | null) {
    this._equipmentInSlot = equipment;
  }
}

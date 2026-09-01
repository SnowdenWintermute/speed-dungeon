import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { makeAutoObservable } from "mobx";
import { EquipmentSlotId, EquipmentSlotType, SLOT_TYPE_BY_SLOT_ID } from "./types.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { invariant } from "../../utils/index.js";

export const COMPATIBLE_ITEMS_BY_SLOT_TYPE: Record<EquipmentSlotType, EquipmentType[]> = {
  [EquipmentSlotType.Head]: [EquipmentType.HeadGear],
  [EquipmentSlotType.Body]: [EquipmentType.BodyArmor],
  [EquipmentSlotType.Finger]: [EquipmentType.Ring],
  [EquipmentSlotType.Neck]: [EquipmentType.Amulet],
  [EquipmentSlotType.MainHand]: [
    EquipmentType.OneHandedMeleeWeapon,
    EquipmentType.TwoHandedMeleeWeapon,
    EquipmentType.TwoHandedRangedWeapon,
  ],
  [EquipmentSlotType.OffHand]: [EquipmentType.OneHandedMeleeWeapon, EquipmentType.Shield],
};

const ALTERNATE_SLOTS: Partial<Record<EquipmentSlotId, EquipmentSlotId>> = {
  [EquipmentSlotId.MainHand]: EquipmentSlotId.OffHand,
  [EquipmentSlotId.FingerMain]: EquipmentSlotId.FingerAlternate,
};

export class EquipmentSlot implements Serializable, ReactiveNode {
  constructor(
    public readonly slotId: EquipmentSlotId,
    private _equipmentInSlot: null | Equipment
  ) {}

  get type() {
    return SLOT_TYPE_BY_SLOT_ID[this.slotId];
  }

  toSerialized() {
    return {
      _equipmentInSlot:
        this._equipmentInSlot === null ? null : this._equipmentInSlot.toSerialized(),
    };
  }

  static fromSerialized(slotId: EquipmentSlotId, serialized: SerializedOf<EquipmentSlot>) {
    let deserializedEquipmentOption: null | Equipment = null;
    if (serialized._equipmentInSlot) {
      deserializedEquipmentOption = Equipment.fromSerialized(serialized._equipmentInSlot);
    }
    return new EquipmentSlot(slotId, deserializedEquipmentOption);
  }

  makeObservable(): void {
    makeAutoObservable(this);
    if (this._equipmentInSlot) {
      this._equipmentInSlot.makeObservable();
    }
  }

  getCompatibleEquipmentTypes() {
    return COMPATIBLE_ITEMS_BY_SLOT_TYPE[this.type];
  }

  canAcceptEquipmentType(equipmentType: EquipmentType) {
    return this.getCompatibleEquipmentTypes().includes(equipmentType);
  }

  get equipmentInSlot(): Readonly<Equipment | null> {
    return this._equipmentInSlot;
  }

  set equipmentInSlot(equipment: Equipment | null) {
    if (equipment !== null) {
      invariant(this.canAcceptEquipmentType(equipment.equipmentBaseItemProperties.equipmentType));
    }
    this._equipmentInSlot = equipment;
  }

  removeEquipmentOption() {
    const value = this._equipmentInSlot;
    this.equipmentInSlot = null;
    return value;
  }

  removeExpectedEquipment() {
    const value = this.removeEquipmentOption();
    if (value === null) {
      throw new Error("expected equipment in this slot");
    }
    return value;
  }

  static getAlternateSlotIdOption(slotId: EquipmentSlotId): EquipmentSlotId | null {
    const option = ALTERNATE_SLOTS[slotId];
    if (option === undefined) {
      return null;
    }
    return option;
  }
}

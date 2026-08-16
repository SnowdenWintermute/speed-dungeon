import cloneDeep from "lodash.clonedeep";
import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { makeAutoObservable } from "mobx";
import { EquipmentSlotTypeNew } from "./types.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";

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

  get equipmentInSlot() {
    return cloneDeep(this._equipmentInSlot);
  }

  set equipmentInSlot(equipment: Equipment | null) {
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
}

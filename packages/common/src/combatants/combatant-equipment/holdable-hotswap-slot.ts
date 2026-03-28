import { makeAutoObservable } from "mobx";
import { EquipmentBaseItem, EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { NumericEnumUtils } from "../../utils/numeric-enum-utils.js";

const DEFAULT_HOTSWAP_SLOT_ALLOWED_TYPES = [
  EquipmentType.OneHandedMeleeWeapon,
  EquipmentType.TwoHandedMeleeWeapon,
  EquipmentType.TwoHandedRangedWeapon,
  EquipmentType.Shield,
];

export class HoldableHotswapSlot implements Serializable, ReactiveNode {
  holdables: Partial<Record<HoldableSlotType, Equipment>> = {};
  forbiddenBaseItems: EquipmentBaseItem[] = [];
  constructor(public allowedTypes: EquipmentType[] = [...DEFAULT_HOTSWAP_SLOT_ALLOWED_TYPES]) {}

  makeObservable(): void {
    makeAutoObservable(this);
    for (const [_, equipment] of iterateNumericEnumKeyedRecord(this.holdables)) {
      equipment.makeObservable();
    }
  }

  toSerialized() {
    const holdables = NumericEnumUtils.serializeNumericEnumRecord(this.holdables);

    return {
      holdables,
      forbiddenBaseItems: this.forbiddenBaseItems,
    };
  }

  static fromSerialized(serialized: SerializedOf<HoldableHotswapSlot>) {
    const result = new HoldableHotswapSlot();
    result.holdables = NumericEnumUtils.deserializeNumericEnumRecord(
      serialized.holdables,
      Equipment.fromSerialized
    );
    result.forbiddenBaseItems = serialized.forbiddenBaseItems;
    return result;
  }
}

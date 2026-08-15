import { makeAutoObservable } from "mobx";
import { Equipment } from "../../items/equipment/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { NumericEnumUtils } from "../../utils/numeric-enum-utils.js";

export class HoldableHotswapSlot implements Serializable, ReactiveNode {
  holdables: Partial<Record<HoldableSlotType, Equipment>> = {};

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
    };
  }

  static fromSerialized(serialized: SerializedOf<HoldableHotswapSlot>) {
    const result = new HoldableHotswapSlot();
    result.holdables = NumericEnumUtils.deserializeNumericEnumRecord(
      serialized.holdables,
      Equipment.fromSerialized
    );
    return result;
  }
}

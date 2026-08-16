import { makeAutoObservable } from "mobx";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { EquipmentSlot } from "./equipment-slot.js";
import { EquipmentSlotId, HoldableSlotId } from "./types.js";

export class HotswapSlot implements Serializable, ReactiveNode {
  constructor(
    public readonly slots: Record<HoldableSlotId, EquipmentSlot> = {
      [EquipmentSlotId.MainHand]: new EquipmentSlot(EquipmentSlotId.MainHand, null),
      [EquipmentSlotId.OffHand]: new EquipmentSlot(EquipmentSlotId.OffHand, null),
    }
  ) {}

  makeObservable() {
    makeAutoObservable(this);
    Object.values(this.slots).forEach((slot) => slot.makeObservable());
  }

  toSerialized() {
    return {
      slots: {
        [EquipmentSlotId.MainHand]: this.slots[EquipmentSlotId.MainHand].toSerialized(),
        [EquipmentSlotId.OffHand]: this.slots[EquipmentSlotId.OffHand].toSerialized(),
      },
    };
  }

  static fromSerialized(serialized: SerializedOf<HotswapSlot>) {
    return new HotswapSlot({
      [EquipmentSlotId.MainHand]: EquipmentSlot.fromSerialized(
        EquipmentSlotId.MainHand,
        serialized.slots[EquipmentSlotId.MainHand]
      ),
      [EquipmentSlotId.OffHand]: EquipmentSlot.fromSerialized(
        EquipmentSlotId.OffHand,
        serialized.slots[EquipmentSlotId.OffHand]
      ),
    });
  }

  getEquipmentInSlot(slotId: HoldableSlotId) {
    return this.slots[slotId].equipmentInSlot;
  }
}

import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { EquipmentSlot } from "./equipment-slot.js";
import { EquipmentSlotId, EquipmentSlotTypeNew, HoldableSlotId } from "./types.js";

export class HotswapSlot implements Serializable, ReactiveNode {
  constructor(
    public readonly slots: Record<HoldableSlotId, EquipmentSlot> = {
      [EquipmentSlotId.MainHand]: new EquipmentSlot(EquipmentSlotTypeNew.Mainhand, null),
      [EquipmentSlotId.OffHand]: new EquipmentSlot(EquipmentSlotTypeNew.Offhand, null),
    }
  ) {}

  makeObservable() {
    this.makeObservable();
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
    const mainHand = serialized.slots[EquipmentSlotId.MainHand];
    const offHand = serialized.slots[EquipmentSlotId.OffHand];
    return new HotswapSlot({
      [EquipmentSlotId.MainHand]: new EquipmentSlot(mainHand.type, mainHand._equipmentInSlot),
      [EquipmentSlotId.OffHand]: new EquipmentSlot(offHand.type, offHand._equipmentInSlot),
    });
  }

  getEquipmentInSlot(slotId: HoldableSlotId) {
    return this.slots[slotId].equipmentInSlot;
  }
}

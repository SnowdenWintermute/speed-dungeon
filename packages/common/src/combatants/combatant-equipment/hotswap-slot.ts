import { makeAutoObservable } from "mobx";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { EquipmentSlot } from "./equipment-slot.js";
import { EquipmentSlotId, EquipmentSlotType, HoldableSlotId } from "./types.js";
import { Equipment } from "../../items/equipment/index.js";

export class HotswapSlot implements Serializable, ReactiveNode {
  constructor(
    public readonly slots: Record<HoldableSlotId, EquipmentSlot> = {
      [EquipmentSlotId.MainHand]: new EquipmentSlot(EquipmentSlotType.Mainhand, null),
      [EquipmentSlotId.OffHand]: new EquipmentSlot(EquipmentSlotType.Offhand, null),
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
    const mainHand = serialized.slots[EquipmentSlotId.MainHand];
    const offHand = serialized.slots[EquipmentSlotId.OffHand];
    return new HotswapSlot({
      [EquipmentSlotId.MainHand]: new EquipmentSlot(
        mainHand.type,
        mainHand._equipmentInSlot ? Equipment.fromSerialized(mainHand._equipmentInSlot) : null
      ),
      [EquipmentSlotId.OffHand]: new EquipmentSlot(
        offHand.type,
        offHand._equipmentInSlot ? Equipment.fromSerialized(offHand._equipmentInSlot) : null
      ),
    });
  }

  getEquipmentInSlot(slotId: HoldableSlotId) {
    return this.slots[slotId].equipmentInSlot;
  }
}

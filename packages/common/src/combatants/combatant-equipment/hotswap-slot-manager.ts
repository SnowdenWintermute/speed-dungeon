import { ERROR_MESSAGES } from "../../errors/index.js";
import { WeaponProperties } from "../../items/equipment/equipment-properties/equipment-properties.js";
import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { invariant } from "../../utils/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { EquipmentSlot, EquipmentSlotId, EquipmentSlotTypeNew, HoldableSlotId } from "./slots.js";

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

export class HotswapSlotsManager implements Serializable, ReactiveNode {
  constructor(
    private getCombatantProperties: () => CombatantProperties,
    private _selectedIndex = 0,
    private _inherentSlots = [new HotswapSlot(), new HotswapSlot()]
  ) {}

  makeObservable(): void {
    this.makeObservable();
    this._inherentSlots.forEach((slot) => slot.makeObservable());
  }

  toSerialized() {
    return {
      _selectedIndex: this.selectedIndex,
      _inherentSlots: this._inherentSlots.map((slot) => slot.toSerialized()),
    };
  }

  static fromSerialized(
    serialized: SerializedOf<HotswapSlotsManager>,
    getCombatantProperties: () => CombatantProperties
  ) {
    return new HotswapSlotsManager(
      getCombatantProperties,
      serialized._selectedIndex,
      serialized._inherentSlots.map((slot) => HotswapSlot.fromSerialized(slot))
    );
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  private set selectedIndex(newIndex: number) {
    this.requireSlotIndexInBounds(newIndex);
    this._selectedIndex = newIndex;
  }

  get allSlots() {
    return [...this._inherentSlots];
  }

  private requireSlotIndexInBounds(newIndex: number) {
    if (!ArrayUtils.indexIsWithinBounds(this.allSlots, newIndex)) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    }
  }

  changeSelectedHotswapSlot(slotIndex: number) {
    const combatantProperties = this.getCombatantProperties();
    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      this.selectedIndex = slotIndex;
    });
  }

  get activeSlot() {
    const value = this._inherentSlots[this.selectedIndex];
    invariant(value !== undefined, ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    return value;
  }

  getWeaponsInSlots(slotIds: HoldableSlotId[], options: { usableWeaponsOnly: boolean }) {
    const toReturn: Partial<
      Record<HoldableSlotId, { equipment: Equipment; weaponProperties: WeaponProperties }>
    > = {};

    for (const slotId of slotIds) {
      const holdable = this.activeSlot.getEquipmentInSlot(slotId);
      if (holdable === null) continue;

      const combatantProperties = this.getCombatantProperties();

      const itemNotUsable =
        !combatantProperties.attributeProperties.hasRequiredAttributesToUseItem(holdable) ||
        holdable.isBroken();

      if (options.usableWeaponsOnly && itemNotUsable) {
        continue;
      }

      if (!holdable.isWeapon()) {
        continue;
      }
      const weaponProperties = holdable.requireWeaponProperties();
      toReturn[slotId] = { equipment: holdable, weaponProperties };
    }

    return toReturn;
  }

  addSlot(newSlot: HotswapSlot) {
    this._inherentSlots.push(newSlot);
  }
}

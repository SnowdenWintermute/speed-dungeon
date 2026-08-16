import { ItemId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { WeaponProperties } from "../../items/equipment/equipment-properties/equipment-properties.js";
import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { invariant, iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { HotswapSlot } from "./hotswap-slot.js";
import { HoldableSlotId } from "./types.js";

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

  removeItemById(itemId: ItemId): Equipment | null {
    for (const hotswapSlot of this.allSlots) {
      for (const [slotId, equipmentSlot] of iterateNumericEnumKeyedRecord(hotswapSlot.slots)) {
        if (equipmentSlot.equipmentInSlot?.entityProperties.id === itemId) {
          return equipmentSlot.removeEquipment();
        }
      }
    }
    return null;
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

  getAllEquipped(options: { includeUnselectedHotswapSlots?: boolean }) {
    const value: (Equipment | null)[] = [];

    if (options?.includeUnselectedHotswapSlots) {
      value.push(
        ...this.allSlots.flatMap((hotswapSlot) =>
          Object.values(hotswapSlot.slots).map((slot) => slot.equipmentInSlot)
        )
      );
    } else {
      value.push(...Object.values(this.activeSlot.slots).map((slot) => slot.equipmentInSlot));
    }

    return value.filter((item) => item !== null);
  }

  addSlot(newSlot: HotswapSlot) {
    this._inherentSlots.push(newSlot);
  }

  /** For checking if a spawned holdable model is still equipped during model synchronization */
  getHotswapSlotIndexAndHoldableSlotOfPotentiallyEquippedHoldable(equipmentId: ItemId) {
    for (let slotIndex = 0; slotIndex < this.allSlots.length; slotIndex += 1) {
      const hotswapSlot = this.allSlots[slotIndex];
      if (hotswapSlot === undefined) {
        throw new Error(ERROR_MESSAGES.EQUIPMENT.EXPECTED_HOTSWAP_SLOT_UNDEFINED);
      }

      for (const [slotId, slot] of iterateNumericEnumKeyedRecord(hotswapSlot.slots)) {
        if (slot.equipmentInSlot?.entityProperties.id === equipmentId) {
          return { slot, slotIndex };
        }
      }
    }

    return null;
  }
}

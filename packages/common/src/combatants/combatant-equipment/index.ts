import {
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  EquipmentSlotType,
  equipmentTypeCanGoInSlot,
  taggedEquipmentSlotsAreEqual,
  TaggedEquipmentSlot,
  WearableSlotType,
  ALL_WEARABLE_SLOTS,
  ALL_HOLDABLE_SLOTS,
} from "../../items/equipment/slots.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { invariant, iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { EntityId } from "../../aliases.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { HoldableHotswapSlot } from "./holdable-hotswap-slot.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { NumericEnumUtils } from "../../utils/numeric-enum-utils.js";
import { Inventory } from "../inventory/index.js";
import {
  EquipmentSlot,
  EquipmentSlotId,
  EquipmentSlotTypeNew,
  HOLDABLE_SLOT_IDS,
  HoldableSlotId,
  WEARABLE_SLOT_IDS,
  WearableSlotId,
} from "./slots.js";
import { HotswapSlotsManager } from "./hotswap-slot-manager.js";

export class CombatantEquipment extends CombatantSubsystem implements Serializable, ReactiveNode {
  private wearables: Partial<Record<WearableSlotType, Equipment>> = {};
  private equippedHoldableHotswapSlotIndex: number = 0;
  private inherentHoldableHotswapSlots: HoldableHotswapSlot[] = [
    new HoldableHotswapSlot(),
    new HoldableHotswapSlot(),
  ];
  //new
  public readonly staticSlots: Record<WearableSlotId, EquipmentSlot> = {
    [EquipmentSlotId.Head]: new EquipmentSlot(EquipmentSlotTypeNew.Head, null),
    [EquipmentSlotId.Body]: new EquipmentSlot(EquipmentSlotTypeNew.Body, null),
    [EquipmentSlotId.FingerMain]: new EquipmentSlot(EquipmentSlotTypeNew.Finger, null),
    [EquipmentSlotId.FingerAlternate]: new EquipmentSlot(EquipmentSlotTypeNew.Finger, null),
    [EquipmentSlotId.Neck]: new EquipmentSlot(EquipmentSlotTypeNew.Neck, null),
  };

  public hotswapSlotsManager = new HotswapSlotsManager(() => this.getCombatantProperties());

  makeObservable() {
    makeAutoObservable(this);
    iterateNumericEnumKeyedRecord(this.wearables).forEach(([_, equipment]) =>
      equipment.makeObservable()
    );
    this.inherentHoldableHotswapSlots.forEach((slot) => slot.makeObservable());
  }

  toSerialized() {
    return {
      wearables: NumericEnumUtils.serializeNumericEnumRecord(this.wearables),
      equippedHoldableHotswapSlotIndex: this.equippedHoldableHotswapSlotIndex,
      inherentHoldableHotswapSlots: this.inherentHoldableHotswapSlots.map((slot) =>
        slot.toSerialized()
      ),
      // new
      staticSlots: {
        [EquipmentSlotId.Head]: this.staticSlots[EquipmentSlotId.Head].toSerialized(),
        [EquipmentSlotId.Body]: this.staticSlots[EquipmentSlotId.Body].toSerialized(),
        [EquipmentSlotId.FingerMain]: this.staticSlots[EquipmentSlotId.FingerMain].toSerialized(),
        [EquipmentSlotId.FingerAlternate]:
          this.staticSlots[EquipmentSlotId.FingerAlternate].toSerialized(),
        [EquipmentSlotId.Neck]: this.staticSlots[EquipmentSlotId.Neck].toSerialized(),
      },
      hotswapSlotsManager: this.hotswapSlotsManager.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<CombatantEquipment>) {
    const result = new CombatantEquipment();
    result.wearables = NumericEnumUtils.deserializeNumericEnumRecord(
      serialized.wearables,
      Equipment.fromSerialized
    );
    result.equippedHoldableHotswapSlotIndex = serialized.equippedHoldableHotswapSlotIndex;
    result.inherentHoldableHotswapSlots = serialized.inherentHoldableHotswapSlots.map((slot) =>
      HoldableHotswapSlot.fromSerialized(slot)
    );
    // new
    result.staticSlots[EquipmentSlotId.Head] = EquipmentSlot.fromSerialized(
      serialized.staticSlots[EquipmentSlotId.Head]
    );
    result.staticSlots[EquipmentSlotId.Body] = EquipmentSlot.fromSerialized(
      serialized.staticSlots[EquipmentSlotId.Body]
    );
    result.staticSlots[EquipmentSlotId.FingerMain] = EquipmentSlot.fromSerialized(
      serialized.staticSlots[EquipmentSlotId.FingerMain]
    );
    result.staticSlots[EquipmentSlotId.FingerAlternate] = EquipmentSlot.fromSerialized(
      serialized.staticSlots[EquipmentSlotId.FingerAlternate]
    );
    result.staticSlots[EquipmentSlotId.Neck] = EquipmentSlot.fromSerialized(
      serialized.staticSlots[EquipmentSlotId.Neck]
    );
    result.hotswapSlotsManager = HotswapSlotsManager.fromSerialized(
      serialized.hotswapSlotsManager,
      () => result.getCombatantProperties()
    );
    return result;
  }

  getSlotById(slotId: EquipmentSlotId) {
    if (WEARABLE_SLOT_IDS.includes(slotId as WearableSlotId)) {
      return this.staticSlots[slotId as WearableSlotId];
    } else if (HOLDABLE_SLOT_IDS.includes(slotId as HoldableSlotId)) {
      return this.hotswapSlotsManager.activeSlot.slots[slotId as HoldableSlotId];
    }
    throw new Error("Expected a slot by the passed EquipmentSlotId to exist");
  }

  putEquipmentInSlot(equipmentItem: Equipment, slotId: EquipmentSlotId) {
    const slot = this.getSlotById(slotId);
    invariant(slot.canAcceptEquipmentType(equipmentItem.equipmentBaseItemProperties.equipmentType));
    slot.equipmentInSlot = equipmentItem;
  }

  /**Optionally choose unselected hotswap slots*/
  getAllEquippedItems(options: { includeUnselectedHotswapSlots?: boolean }) {
    const toReturn: Equipment[] = [];

    let slotsToInclude = [this.getActiveHoldableSlot()];
    if (options.includeUnselectedHotswapSlots) {
      slotsToInclude = this.getHoldableHotswapSlots();
    }

    for (const hotswapSlot of slotsToInclude) {
      for (const item of Object.values(hotswapSlot.holdables)) {
        if (item) toReturn.push(item);
      }
    }

    toReturn.push(...Object.values(this.wearables).filter((item) => item !== undefined));

    return toReturn;
  }

  getEquippedLifestealPercentage(): number {
    let total = 0;
    for (const equippedItem of this.getAllEquippedItems({ includeUnselectedHotswapSlots: false })) {
      total += equippedItem.getLifestealPercentage();
    }
    return total;
  }

  getEquippedNonWeaponFlatDamageBonus(): number {
    let total = 0;
    for (const equippedItem of this.getAllEquippedItems({ includeUnselectedHotswapSlots: false })) {
      // a weapon's own flat damage is applied per-weapon with its percent-damage modifier, so only
      // non-weapon items (ex: the lantern shield's flat damage suffix) are aggregated here
      if (equippedItem.isWeapon()) {
        continue;
      }
      total += equippedItem.getFlatDamageBonus();
    }
    return total;
  }

  getEquipmentInSlot(taggedSlot: TaggedEquipmentSlot) {
    switch (taggedSlot.type) {
      case EquipmentSlotType.Holdable:
        return this.getEquippedHoldable(taggedSlot.slot);
      case EquipmentSlotType.Wearable:
        return this.wearables[taggedSlot.slot];
    }
  }

  getSlotItemIsEquippedTo(itemId: string): null | TaggedEquipmentSlot {
    for (const [slot, item] of iterateNumericEnumKeyedRecord(this.wearables)) {
      if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Wearable, slot };
    }

    const holdableSlotsOption = this.getActiveHoldableSlot();
    if (!holdableSlotsOption) return null;

    for (const [slot, item] of iterateNumericEnumKeyedRecord(holdableSlotsOption.holdables)) {
      if (item.entityProperties.id === itemId) return { type: EquipmentSlotType.Holdable, slot };
    }

    return null;
  }

  canEquip(equipment: Equipment): Error | void {
    const combatantProperties = this.getCombatantProperties();

    if (!combatantProperties.attributeProperties.hasRequiredAttributesToUseItem(equipment)) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.REQUIREMENTS_NOT_MET);
    }
    if (equipment.isBroken()) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.IS_BROKEN);
    }
  }

  /**
  returns list of item ids unequipped
  */
  equipItem(
    itemId: string,
    equipToAltSlot: boolean
  ): Error | { idsOfUnequippedItems: EntityId[]; unequippedSlots: TaggedEquipmentSlot[] } {
    const combatantProperties = this.getCombatantProperties();

    const equipmentResult = combatantProperties.inventory.getEquipmentById(itemId);
    if (equipmentResult instanceof Error) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
    const equipment = equipmentResult;

    const maybeError = this.canEquip(equipment);
    if (maybeError instanceof Error) return maybeError;

    const removedResult = combatantProperties.inventory.removeEquipment(itemId);
    if (removedResult instanceof Error) return removedResult;

    return this.putEquipmentInSlotUnequippingConflicts(removedResult, equipToAltSlot);
  }

  /** Equips an item lying in the room, never routing it through the inventory. Anything already in
  the destination slot is unequipped into the inventory as usual. */
  equipItemFromGround(
    itemId: string,
    groundInventory: Inventory,
    equipToAltSlot: boolean
  ): Error | { idsOfUnequippedItems: EntityId[]; unequippedSlots: TaggedEquipmentSlot[] } {
    const equipmentResult = groundInventory.getEquipmentById(itemId);
    if (equipmentResult instanceof Error) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    const equipment = equipmentResult;

    const maybeError = this.canEquip(equipment);
    if (maybeError instanceof Error) return maybeError;

    const removedResult = groundInventory.removeEquipment(itemId);
    if (removedResult instanceof Error) return removedResult;

    return this.putEquipmentInSlotUnequippingConflicts(removedResult, equipToAltSlot);
  }

  /** Expects the equipment to already have been removed from wherever it came from. */
  private putEquipmentInSlotUnequippingConflicts(
    equipment: Equipment,
    equipToAltSlot: boolean
  ): { idsOfUnequippedItems: EntityId[]; unequippedSlots: TaggedEquipmentSlot[] } {
    const combatantProperties = this.getCombatantProperties();

    const idsOfUnequippedItems: EntityId[] = [];
    const slotsToUnequip: TaggedEquipmentSlot[] = [];

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const { equipmentType } = equipment.equipmentBaseItemProperties;

      const possibleSlots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];

      const slot = (() => {
        if (equipToAltSlot && possibleSlots.alternate !== null) return possibleSlots.alternate;
        else return possibleSlots.main;
      })();

      // @REFACTOR
      const slotsToUnequipResult = ((): TaggedEquipmentSlot[] => {
        switch (slot.type) {
          case EquipmentSlotType.Holdable:
            switch (slot.slot) {
              case HoldableSlotType.MainHand:
                if (equipment.isTwoHanded()) {
                  return [
                    { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
                    { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
                  ];
                } else {
                  return [slot];
                }
              case HoldableSlotType.OffHand: {
                const equippedHotswapSlot = combatantProperties.equipment.getActiveHoldableSlot();
                if (!equippedHotswapSlot) return [];

                const itemInMainHandOption =
                  equippedHotswapSlot.holdables[HoldableSlotType.MainHand];

                if (itemInMainHandOption !== undefined) {
                  if (equipment.isTwoHanded() || itemInMainHandOption.isTwoHanded()) {
                    return [
                      { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.MainHand },
                      { type: EquipmentSlotType.Holdable, slot: HoldableSlotType.OffHand },
                    ];
                  }
                }
                return [slot];
              }
            }
            break;
          case EquipmentSlotType.Wearable:
            return [slot];
        }
      })();

      slotsToUnequip.push(...slotsToUnequipResult);

      idsOfUnequippedItems.push(...combatantProperties.equipment.unequipSlots(slotsToUnequip));

      combatantProperties.equipment.putEquipmentInSlot(equipment, slot);
    });

    return { idsOfUnequippedItems, unequippedSlots: slotsToUnequip };
  }

  /** Moves an already equipped item to another of its legal slots. Whatever occupies the
  destination trades places with it if it can legally go in the vacated slot, otherwise it is
  unequipped into the inventory. */
  moveEquippedItemToSlot(
    sourceSlot: TaggedEquipmentSlot,
    destinationSlot: TaggedEquipmentSlot
  ): Error | { idsOfUnequippedItems: EntityId[] } {
    if (taggedEquipmentSlotsAreEqual(sourceSlot, destinationSlot)) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.ALREADY_IN_SLOT);
    }

    const item = this.getEquipmentInSlot(sourceSlot);
    if (item === undefined) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
    }

    const { equipmentType } = item.equipmentBaseItemProperties;
    if (!equipmentTypeCanGoInSlot(equipmentType, destinationSlot)) {
      return new Error(ERROR_MESSAGES.EQUIPMENT.CANNOT_GO_IN_SLOT);
    }

    const combatantProperties = this.getCombatantProperties();
    const idsOfUnequippedItems: EntityId[] = [];

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const displacedOption = this.getEquipmentInSlot(destinationSlot);

      this.removeEquipmentInSlots([sourceSlot, destinationSlot]);

      if (displacedOption !== undefined) {
        const displacedCanSwap = equipmentTypeCanGoInSlot(
          displacedOption.equipmentBaseItemProperties.equipmentType,
          sourceSlot
        );

        if (displacedCanSwap) {
          this.putEquipmentInSlot(displacedOption, sourceSlot);
        } else {
          combatantProperties.inventory.insertItem(displacedOption);
          idsOfUnequippedItems.push(displacedOption.entityProperties.id);
        }
      }

      this.putEquipmentInSlot(item, destinationSlot);
    });

    return { idsOfUnequippedItems };
  }

  unequipSlots(slots: TaggedEquipmentSlot[]) {
    const unequippedItemIds: string[] = [];

    const combatantProperties = this.getCombatantProperties();

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const unequippedItems = combatantProperties.equipment.removeEquipmentInSlots(slots);
      combatantProperties.inventory.equipment.push(...unequippedItems);
      unequippedItemIds.push(...unequippedItems.map((item) => item.entityProperties.id));
    });
    return unequippedItemIds;
  }

  unequipAll() {
    this.unequipSlots(ALL_WEARABLE_SLOTS);
    this.getHoldableHotswapSlots().forEach((slot, index) => {
      this.hotswapSlotsManager.changeSelectedHotswapSlot(index);
      this.unequipSlots(ALL_HOLDABLE_SLOTS);
    });
  }

  private removeEquipmentInSlots(slots: TaggedEquipmentSlot[]) {
    const unequippedItems: Equipment[] = [];

    for (const slot of slots) {
      let itemOption: Equipment | undefined;

      switch (slot.type) {
        case EquipmentSlotType.Holdable:
          {
            const equippedHoldableHotswapSlot = this.getActiveHoldableSlot();
            if (!equippedHoldableHotswapSlot) continue;
            itemOption = equippedHoldableHotswapSlot.holdables[slot.slot];
            delete equippedHoldableHotswapSlot.holdables[slot.slot];
          }
          break;
        case EquipmentSlotType.Wearable:
          itemOption = this.wearables[slot.slot];
          delete this.wearables[slot.slot];
          break;
      }
      if (itemOption === undefined) continue;

      unequippedItems.push(itemOption);
    }

    return unequippedItems;
  }

  removeItem(itemId: string) {
    for (const [slot, item] of iterateNumericEnumKeyedRecord(this.wearables)) {
      if (item.entityProperties.id === itemId) {
        delete this.wearables[slot];
        return item;
      }
    }

    const allHotswapSlots = this.getHoldableHotswapSlots();
    for (const hotswapSlot of allHotswapSlots) {
      for (const [slot, item] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
        if (item.entityProperties.id === itemId) {
          delete hotswapSlot.holdables[slot];
          return item;
        }
      }
    }

    throw new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getEquippedShieldProperties() {
    const offhandOption = this.getEquipmentInSlot({
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    });
    if (offhandOption === undefined) return;
    if (offhandOption.equipmentBaseItemProperties.equipmentType !== EquipmentType.Shield) return;
    return offhandOption.equipmentBaseItemProperties;
  }

  private static isHoldingUsableHoldable(
    actionUser: IActionUser,
    slot: HoldableSlotType,
    type: EquipmentType
  ): boolean {
    const equipment = actionUser.getEquipmentOption();
    if (!equipment) return false;

    const itemOption = equipment.getEquipmentInSlot({ type: EquipmentSlotType.Holdable, slot });
    if (!itemOption) return false;

    if (itemOption.equipmentBaseItemProperties.equipmentType !== type) return false;

    const isBroken = itemOption.isBroken();
    if (isBroken) return false;
    return actionUser.hasRequiredAttributesToUseItem(itemOption);
  }

  isWearingItemWithId(itemId: string) {
    return this.getAllEquippedItems({ includeUnselectedHotswapSlots: true })
      .map((equipment) => equipment.entityProperties.id)
      .includes(itemId);
  }

  static isWearingUsableShield(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(actionUser, HoldableSlotType.OffHand, EquipmentType.Shield);
  }

  static isWearingUsableTwoHandedRangedWeapon(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(
      actionUser,
      HoldableSlotType.MainHand,
      EquipmentType.TwoHandedRangedWeapon
    );
  }

  static isWearingUsableTwoHandedMeleeWeapon(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(
      actionUser,
      HoldableSlotType.MainHand,
      EquipmentType.TwoHandedMeleeWeapon
    );
  }

  isWearingRequiredEquipmentToUseAction(actionAndRank: ActionAndRank) {
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { getRequiredEquipmentTypeOptions } = action.targetingProperties;
    if (getRequiredEquipmentTypeOptions(rank).length === 0) {
      return true;
    }

    const allEquipment = this.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });

    for (const equipment of allEquipment) {
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipment.isBroken()) continue;
      if (getRequiredEquipmentTypeOptions(rank).includes(equipmentType)) return true;
    }

    return false;
  }

  /** For checking if a spawned holdable model is still equipped during model synchronization */
  getHotswapSlotIndexAndHoldableSlotOfPotentiallyEquippedHoldable(equipmentId: EntityId) {
    const allHotswapSlots = this.getHoldableHotswapSlots();

    for (let slotIndex = 0; slotIndex < allHotswapSlots.length; slotIndex += 1) {
      const hotswapSlot = allHotswapSlots[slotIndex];
      if (hotswapSlot === undefined) {
        throw new Error(ERROR_MESSAGES.EQUIPMENT.EXPECTED_HOTSWAP_SLOT_UNDEFINED);
      }

      for (const [holdableSlot, holdable] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
        if (holdable.entityProperties.id === equipmentId) {
          return { holdableSlot, slotIndex };
        }
      }
    }

    return null;
  }
}

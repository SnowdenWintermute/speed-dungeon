import { plainToInstance } from "class-transformer";
import {
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  WeaponProperties,
} from "../../items/equipment/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../../utils/index.js";
import { EntityId } from "../../primatives/index.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { makeAutoObservable } from "mobx";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";

export * from "./equip-item.js";
export * from "./unequip-slots.js";
export * from "./get-weapons-in-slots.js";
export * from "./change-selected-hotswap-slot.js";
export * from "./get-pre-equipment-change-hp-and-mana-percentage.js";
export * from "./apply-equipment-affect-while-maintaining-resource-percentages.js";

const DEFAULT_HOTSWAP_SLOT_ALLOWED_TYPES = [
  EquipmentType.OneHandedMeleeWeapon,
  EquipmentType.TwoHandedMeleeWeapon,
  EquipmentType.TwoHandedRangedWeapon,
  EquipmentType.Shield,
];

/// We take CombatantProperties as an argument instead of CombatantEquipment because we
// may want to get hotswap slots derrived from traits
export class HoldableHotswapSlot {
  holdables: Partial<Record<HoldableSlotType, Equipment>> = {};
  forbiddenBaseItems: EquipmentBaseItem[] = [];
  constructor(public allowedTypes: EquipmentType[] = [...DEFAULT_HOTSWAP_SLOT_ALLOWED_TYPES]) {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(holdableSlot: HoldableHotswapSlot) {
    return plainToInstance(HoldableHotswapSlot, holdableSlot);
  }
}

export class CombatantEquipment {
  private wearables: Partial<Record<WearableSlotType, Equipment>> = {};
  private equippedHoldableHotswapSlotIndex: number = 0;
  private inherentHoldableHotswapSlots: HoldableHotswapSlot[] = [
    new HoldableHotswapSlot(),
    new HoldableHotswapSlot(),
  ];

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  getHoldableHotswapSlots(): HoldableHotswapSlot[] {
    return this.inherentHoldableHotswapSlots;
  }

  getSelectedHoldableSlotIndex() {
    return this.equippedHoldableHotswapSlotIndex;
  }

  setSelectedHoldableSlotIndex(newIndex: number) {
    this.equippedHoldableHotswapSlotIndex = newIndex;
  }

  getWearables() {
    return this.wearables;
  }

  getActiveHoldableSlot() {
    const slots = this.getHoldableHotswapSlots()[this.equippedHoldableHotswapSlotIndex];

    if (slots === undefined) throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    return slots;
  }

  getEquippedHoldable(holdableSlotType: HoldableSlotType) {
    const equippedHoldableHotswapSlot = this.getActiveHoldableSlot();
    return equippedHoldableHotswapSlot.holdables[holdableSlotType];
  }

  getEquippedWeapon(holdableSlot: HoldableSlotType): undefined | Error | WeaponProperties {
    const itemOption = this.getEquippedHoldable(holdableSlot);
    if (itemOption === undefined) return undefined;

    return Equipment.getWeaponProperties(itemOption);
  }

  /** Used when deserializing since the slots also need to be deserialized but they are private
   * so we can't just directly write to them */
  replaceHoldableSlots(replacementSlots: HoldableHotswapSlot[]) {
    this.inherentHoldableHotswapSlots = replacementSlots;
  }

  addHoldableSlot(newSlot: HoldableHotswapSlot) {
    this.inherentHoldableHotswapSlots.push(newSlot);
  }

  static getDeserialized(equipment: CombatantEquipment) {
    const deserialized = plainToInstance(CombatantEquipment, equipment);

    for (const [slot, item] of iterateNumericEnumKeyedRecord(deserialized.wearables)) {
      deserialized.wearables[slot] = plainToInstance(Equipment, item);
    }

    const deserializedHotswapSlots = deserialized
      .getHoldableHotswapSlots()
      .map((slot) => HoldableHotswapSlot.getDeserialized(slot));
    deserialized.replaceHoldableSlots(deserializedHotswapSlots);

    for (const hotswapSlot of Object.values(deserialized.getHoldableHotswapSlots())) {
      for (const [slot, item] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
        hotswapSlot.holdables[slot] = plainToInstance(Equipment, item);
      }
    }

    return deserialized;
  }

  putEquipmentInSlot(equipmentItem: Equipment, taggedSlot: TaggedEquipmentSlot) {
    switch (taggedSlot.type) {
      case EquipmentSlotType.Holdable:
        const equippedHoldableHotswapSlot = this.getActiveHoldableSlot();
        if (!equippedHoldableHotswapSlot) {
          throw new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);
        }
        equippedHoldableHotswapSlot.holdables[taggedSlot.slot] = equipmentItem;
        break;
      case EquipmentSlotType.Wearable:
        this.wearables[taggedSlot.slot] = equipmentItem;
        break;
    }
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

  unequipSlots(slots: TaggedEquipmentSlot[]) {
    const unequippedItems: Equipment[] = [];

    for (const slot of slots) {
      let itemOption: Equipment | undefined;

      switch (slot.type) {
        case EquipmentSlotType.Holdable:
          const equippedHoldableHotswapSlot = this.getActiveHoldableSlot();
          if (!equippedHoldableHotswapSlot) continue;
          itemOption = equippedHoldableHotswapSlot.holdables[slot.slot];
          delete equippedHoldableHotswapSlot.holdables[slot.slot];
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

    return Equipment.isUsable(actionUser, itemOption);
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
    if (getRequiredEquipmentTypeOptions(rank).length === 0) return true;

    const allEquipment = this.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });

    for (const equipment of allEquipment) {
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (Equipment.isBroken(equipment)) continue;
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
        if (holdable.entityProperties.id === equipmentId) return { holdableSlot, slotIndex };
      }
    }

    return null;
  }
}

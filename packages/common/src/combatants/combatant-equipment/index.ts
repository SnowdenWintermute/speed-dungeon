import { plainToInstance } from "class-transformer";
import { Equipment, EquipmentBaseItem, EquipmentType } from "../../items/equipment/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { CombatantProperties } from "../index.js";
import { EntityId } from "../../primatives/index.js";

export * from "./equip-item.js";
export * from "./unequip-slots.js";
export * from "./get-equipped-weapon.js";
export * from "./get-weapons-in-slots.js";
export * from "./get-slot-item-is-equipped-to.js";
export * from "./change-selected-hotswap-slot.js";
export * from "./get-pre-equipment-change-hp-and-mana-percentage.js";
export * from "./apply-equipment-affect-while-maintaining-resource-percentages.js";

/// We take CombatantProperties as an argument instead of CombatantEquipment because we
// may want to get hotswap slots derrived from traits
export class HoldableHotswapSlot {
  holdables: Partial<Record<HoldableSlotType, Equipment>> = {};
  forbiddenBaseItems: EquipmentBaseItem[] = [];
  constructor(
    public allowedTypes: EquipmentType[] = [
      EquipmentType.OneHandedMeleeWeapon,
      EquipmentType.TwoHandedMeleeWeapon,
      EquipmentType.TwoHandedRangedWeapon,
      EquipmentType.Shield,
    ]
  ) {}
}

export class CombatantEquipment {
  wearables: Partial<Record<WearableSlotType, Equipment>> = {};
  equippedHoldableHotswapSlotIndex: number = 0;
  inherentHoldableHotswapSlots: HoldableHotswapSlot[] = [
    new HoldableHotswapSlot(),
    new HoldableHotswapSlot(),
  ];
  static getHoldableHotswapSlots(combatantProperties: CombatantProperties): HoldableHotswapSlot[] {
    const slotsFromTraits = [];
    for (const trait of combatantProperties.traits) {
      if (trait.type === CombatantTraitType.ExtraHotswapSlot) {
        slotsFromTraits.push(trait.hotswapSlot);
      }
    }

    return [...combatantProperties.equipment.inherentHoldableHotswapSlots, ...slotsFromTraits];
  }

  static getEquippedHoldableSlots(combatantProperties: CombatantProperties) {
    const slots =
      this.getHoldableHotswapSlots(combatantProperties)[
        combatantProperties.equipment.equippedHoldableHotswapSlotIndex
      ];

    if (slots === undefined) throw new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);
    return slots;
  }

  static getEquippedHoldable(
    combatantProperties: CombatantProperties,
    holdableSlotType: HoldableSlotType
  ) {
    const equippedHoldableHotswapSlot =
      CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
    if (!equippedHoldableHotswapSlot) return undefined;
    return equippedHoldableHotswapSlot.holdables[holdableSlotType];
  }

  static instatiateItemClasses(combatantProperties: CombatantProperties) {
    const { equipment } = combatantProperties;
    for (const [slot, item] of iterateNumericEnumKeyedRecord(equipment.wearables)) {
      equipment.wearables[slot] = plainToInstance(Equipment, item);
    }
    for (const hotswapSlot of Object.values(
      CombatantEquipment.getHoldableHotswapSlots(combatantProperties)
    )) {
      for (const [slot, item] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
        hotswapSlot.holdables[slot] = plainToInstance(Equipment, item);
      }
    }
  }

  static putEquipmentInSlot(
    combatantProperties: CombatantProperties,
    equipmentItem: Equipment,
    taggedSlot: TaggedEquipmentSlot
  ) {
    switch (taggedSlot.type) {
      case EquipmentSlotType.Holdable:
        const equippedHoldableHotswapSlot =
          CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
        if (!equippedHoldableHotswapSlot)
          return new Error(ERROR_MESSAGES.EQUIPMENT.NO_SELECTED_HOTSWAP_SLOT);
        equippedHoldableHotswapSlot.holdables[taggedSlot.slot] = equipmentItem;
        break;
      case EquipmentSlotType.Wearable:
        combatantProperties.equipment.wearables[taggedSlot.slot] = equipmentItem;
        break;
    }
  }

  /**Optionally choose unselected hotswap slots*/
  static getAllEquippedItems(
    combatantProperties: CombatantProperties,
    options: { includeUnselectedHotswapSlots?: boolean }
  ) {
    const toReturn: Equipment[] = [];

    if (options.includeUnselectedHotswapSlots) {
      for (const hotswapSlot of CombatantEquipment.getHoldableHotswapSlots(combatantProperties)) {
        for (const [slot, item] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
          toReturn.push(item);
        }
      }
    } else {
      // only want selected slot
      const equippedHoldableHotswapSlot =
        CombatantEquipment.getEquippedHoldableSlots(combatantProperties);

      if (equippedHoldableHotswapSlot)
        toReturn.push(
          ...Object.values(equippedHoldableHotswapSlot.holdables).filter(
            (item) => item !== undefined
          )
        );
    }

    toReturn.push(
      ...Object.values(combatantProperties.equipment.wearables).filter((item) => item !== undefined)
    );

    return toReturn;
  }

  static getEquipmentInSlot(
    combatantProperties: CombatantProperties,
    taggedSlot: TaggedEquipmentSlot
  ) {
    switch (taggedSlot.type) {
      case EquipmentSlotType.Holdable:
        return CombatantEquipment.getEquippedHoldable(combatantProperties, taggedSlot.slot);
      case EquipmentSlotType.Wearable:
        return combatantProperties.equipment.wearables[taggedSlot.slot];
    }
  }

  static removeItem(combatantProperties: CombatantProperties, itemId: string) {
    const { equipment } = combatantProperties;

    for (const [slot, item] of iterateNumericEnumKeyedRecord(equipment.wearables)) {
      if (item.entityProperties.id === itemId) {
        delete equipment.wearables[slot];
        return item;
      }
    }

    const allHotswapSlots = CombatantEquipment.getHoldableHotswapSlots(combatantProperties);
    for (const hotswapSlot of allHotswapSlots) {
      for (const [slot, item] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
        if (item.entityProperties.id === itemId) {
          delete hotswapSlot.holdables[slot];
          return item;
        }
      }
    }

    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getEquippedShieldProperties(combatantProperties: CombatantProperties) {
    const offhandOption = CombatantEquipment.getEquipmentInSlot(combatantProperties, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    });
    if (!offhandOption) return;
    if (offhandOption.equipmentBaseItemProperties.equipmentType !== EquipmentType.Shield) return;
    return offhandOption.equipmentBaseItemProperties;
  }

  static isWearingUsableShield(combatantProperties: CombatantProperties): boolean {
    const offHandEquipmentOption = CombatantEquipment.getEquipmentInSlot(combatantProperties, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    });

    console.log("equipment in off hand: ", offHandEquipmentOption);

    if (!offHandEquipmentOption) return false;
    const { equipmentType } = offHandEquipmentOption.equipmentBaseItemProperties;
    const isShield = equipmentType === EquipmentType.Shield;
    console.log("is shield: ", isShield);
    if (!isShield) return false;
    const isUsable = Equipment.isUsable(combatantProperties, offHandEquipmentOption);
    console.log("is usable: ", isUsable);

    return isUsable;
  }

  static getHotswapSlotIndexAndHoldableSlotOfPotentiallyEquippedHoldable(
    combatantProperties: CombatantProperties,
    equipmentId: EntityId
  ) {
    const allHotswapSlots = CombatantEquipment.getHoldableHotswapSlots(combatantProperties);

    let slotIndex = -1;
    for (const hotswapSlot of allHotswapSlots) {
      slotIndex += 1;

      for (const [holdableSlot, holdable] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables))
        if (holdable.entityProperties.id === equipmentId) return { holdableSlot, slotIndex };
    }

    return null;
  }
}

import { plainToInstance } from "class-transformer";
import { Equipment, EquipmentBaseItem, EquipmentType } from "../../items/equipment/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  TaggedEquipmentSlot,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { CombatantProperties } from "../combatant-properties.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantTraitType } from "../combatant-traits.js";

export * from "./equip-item.js";
export * from "./unequip-slots.js";
export * from "./get-equipped-weapon.js";
export * from "./get-usable-weapons-in-slots.js";
export * from "./get-slot-item-is-equipped-to.js";
export * from "./change-selected-hotswap-slot.js";
// equipment: Partial<Record<EquipmentSlot, Item>> = {};

// holdable equipment hotswap slots
// - should hold the item separately of the inventory bags
// - should be consistently accessible by their number (same items each time)
// - should be limitable by the type of equipment they can hold (shield only, swords only etc)
// - body armor can have hotswap slots on a trait
// - combatant getHotswapSlots searches through inherent slots, slots from combatantTraits and slots from equipped items
// - unequipping an item with a hotswapSlot trait removes the items stored in the slots, and is only allowed if
// there is room in the inventory
//
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
    return this.getHoldableHotswapSlots(combatantProperties)[
      combatantProperties.equipment.equippedHoldableHotswapSlotIndex
    ];
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

  static getAllEquippedItems(combatantProperties: CombatantProperties) {
    const toReturn: Equipment[] = [];
    const equippedHoldableHotswapSlot =
      CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
    if (equippedHoldableHotswapSlot)
      toReturn.push(
        ...Object.values(equippedHoldableHotswapSlot.holdables).filter((item) => item !== undefined)
      );

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
}

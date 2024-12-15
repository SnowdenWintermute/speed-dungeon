import { Equipment, EquipmentBaseItem, EquipmentType } from "../../items/equipment/index.js";
import { EquipmentSlot, HoldableSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "../combatant-properties.js";

export * from "./equip-item.js";
export * from "./unequip-slots.js";
export * from "./get-equipped-weapon.js";
export * from "./get-usable-weapons-in-slots.js";
export * from "./get-slot-item-is-equipped-to.js";
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
  holdables: Partial<Record<HoldableSlot, Equipment>> = {};
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
  wearables: Partial<Record<EquipmentSlot, Equipment>> = {};
  equippedHoldableHotswapSlotIndex: number = 0;
  inherentHoldableHotswapSlots: HoldableHotswapSlot[] = [new HoldableHotswapSlot()];
  // getAttributes
  // getWeaponHotswapSets
  // currentWeaponHotswapSet - number
  static getHoldableHotswapSlots(combatantProperties: CombatantProperties): HoldableHotswapSlot[] {
    return [];
  }
}

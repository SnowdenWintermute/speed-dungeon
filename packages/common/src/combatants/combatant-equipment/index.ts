export * from "./equip-item.js";
export * from "./unequip-slots.js";
export * from "./get-equipped-weapon.js";
export * from "./get-equipment-in-slot.js";
export * from "./get-usable-weapons-in-slots.js";
export * from "./get-slot-item-is-equipped-to.js";
// equipment: Partial<Record<EquipmentSlot, Item>> = {};

// holdable equipment hotswap slots
// - should hold the item separately of the inventory bags
// - should be consistently accessible by their number (same items each time)
// - should be limitable by the type of equipment they can hold (shield only, swords only etc)

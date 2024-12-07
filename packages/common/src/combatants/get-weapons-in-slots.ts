import { EquipmentSlot, Item, WeaponSlot } from "../items/index.js";
import { CombatantProperties } from "./combatant-properties.js";

/** Returning as Item type because we may need to check if combatant is wearing an item they can't currently use */
export function getWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: WeaponSlot[]
) {
  const toReturn: Partial<Record<WeaponSlot, Item>> = {};

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
    const weapon = combatantProperties.equipment[equipmentSlot];
    if (!weapon) continue;
    toReturn[weaponSlot] = weapon;
  }

  return toReturn;
}

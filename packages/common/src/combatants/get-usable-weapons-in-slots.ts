import { EquipmentSlot, Item, WeaponSlot } from "../items/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export function getUsableWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: WeaponSlot[]
) {
  const toReturn: Partial<Record<WeaponSlot, Item>> = {};

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
    const weapon = combatantProperties.equipment[equipmentSlot];
    if (!weapon) continue;
    if (!CombatantProperties.canUseItem(combatantProperties, weapon)) continue;
    toReturn[weaponSlot] = weapon;
  }

  return toReturn;
}

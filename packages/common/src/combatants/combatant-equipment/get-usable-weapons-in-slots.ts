import { EquipmentSlot, Item, WeaponProperties, WeaponSlot } from "../../items/index.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getUsableWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: WeaponSlot[]
) {
  const toReturn: Partial<Record<WeaponSlot, { item: Item; weaponProperties: WeaponProperties }>> =
    {};

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
    const weapon = combatantProperties.equipment[equipmentSlot];
    if (!weapon) continue;
    if (!CombatantProperties.canUseItem(combatantProperties, weapon)) continue;

    const weaponPropertiesResult = Item.getWeaponProperties(weapon);
    if (weaponPropertiesResult instanceof Error) continue; // could be a shield so just skip it
    toReturn[weaponSlot] = { item: weapon, weaponProperties: weaponPropertiesResult };
  }

  return toReturn;
}

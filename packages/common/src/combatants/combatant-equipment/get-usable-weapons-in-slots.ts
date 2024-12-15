import { Equipment, WeaponProperties } from "../../items/equipment/index.js";
import { EquipmentSlot, WeaponSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getUsableWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: WeaponSlot[]
) {
  const toReturn: Partial<
    Record<WeaponSlot, { equipment: Equipment; weaponProperties: WeaponProperties }>
  > = {};

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
    const weapon = combatantProperties.equipment[equipmentSlot];
    if (!weapon) continue;
    if (!CombatantProperties.canUseItem(combatantProperties, weapon)) continue;

    const weaponPropertiesResult = Equipment.getWeaponProperties(weapon);
    if (weaponPropertiesResult instanceof Error) continue; // could be a shield so just skip it
    toReturn[weaponSlot] = { equipment: weapon, weaponProperties: weaponPropertiesResult };
  }

  return toReturn;
}

import { EquipmentProperties, Item, WeaponSlot } from "../../../../items/index.js";
import { NumberRange } from "../../../../primatives/index.js";

export function addWeaponsDamageToRange(
  weapons: Partial<Record<WeaponSlot, Item>>,
  range: NumberRange
) {
  for (const weapon of Object.values(weapons)) {
    const equipmentProperties = Item.getEquipmentProperties(weapon);
    if (equipmentProperties instanceof Error) continue;

    const weaponDamageResult =
      EquipmentProperties.getModifiedWeaponDamageRange(equipmentProperties);
    if (weaponDamageResult instanceof Error) {
      console.error(weaponDamageResult);
      continue;
    }

    range.min += weaponDamageResult.min;
    range.max += weaponDamageResult.max;
  }
}

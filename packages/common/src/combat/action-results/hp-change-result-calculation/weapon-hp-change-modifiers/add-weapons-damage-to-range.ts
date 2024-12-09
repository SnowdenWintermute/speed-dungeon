import {
  EquipmentProperties,
  Item,
  WeaponProperties,
  WeaponSlot,
} from "../../../../items/index.js";
import { NumberRange } from "../../../../primatives/index.js";

export function addWeaponsDamageToRange(
  weapons: Partial<Record<WeaponSlot, { item: Item; weaponProperties: WeaponProperties }>>,
  range: NumberRange
) {
  for (const { item, weaponProperties } of Object.values(weapons)) {
    const equipmentProperties = Item.getEquipmentProperties(item);
    if (equipmentProperties instanceof Error) continue;

    const weaponDamage = EquipmentProperties.getModifiedWeaponDamageRange(
      equipmentProperties.affixes,
      weaponProperties.damage
    );

    range.min += weaponDamage.min;
    range.max += weaponDamage.max;
  }
}

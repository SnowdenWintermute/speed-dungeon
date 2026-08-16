import { EquipmentSlotId } from "../../../combatants/combatant-equipment/types.js";
import { WeaponProperties } from "../../../items/equipment/equipment-properties/index.js";
import { Equipment } from "../../../items/equipment/index.js";
import { NumberRange } from "../../../primatives/number-range.js";

export function addWeaponsDamageToRange(
  weapons: Partial<
    Record<EquipmentSlotId, { equipment: Equipment; weaponProperties: WeaponProperties }>
  >,
  range: NumberRange
) {
  for (const { equipment, weaponProperties } of Object.values(weapons)) {
    const weaponDamage = Equipment.getModifiedWeaponDamageRange(
      equipment.affixes,
      weaponProperties.damage
    );

    range.min += weaponDamage.min;
    range.max += weaponDamage.max;
  }
}

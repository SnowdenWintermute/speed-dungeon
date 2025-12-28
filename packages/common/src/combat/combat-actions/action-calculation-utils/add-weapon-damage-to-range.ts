import { WeaponProperties } from "../../../items/equipment/equipment-properties/weapon-properties.js";
import { Equipment } from "../../../items/equipment/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { NumberRange } from "../../../primatives/number-range.js";

export function addWeaponsDamageToRange(
  weapons: Partial<
    Record<HoldableSlotType, { equipment: Equipment; weaponProperties: WeaponProperties }>
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

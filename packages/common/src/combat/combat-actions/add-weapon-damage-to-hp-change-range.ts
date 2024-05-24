import { CombatantProperties } from "../../combatants";
import { WeaponSlot } from "../../items";
import NumberRange from "../../primatives/number-range";

export default function addWeaponDamageToCombatActionHpChange(
  weaponSlots: WeaponSlot[],
  userCombatantProperties: CombatantProperties,
  hpChangeRange: NumberRange
) {
  for (const slot of weaponSlots) {
    calculateAndAddWeaponDamage(userCombatantProperties, slot, hpChangeRange);
  }
}

function calculateAndAddWeaponDamage(
  userCombatantProperties: CombatantProperties,
  weaponSlot: WeaponSlot,
  range: NumberRange
) {
  const weaponOption = userCombatantProperties.getEquippedWeapon(weaponSlot);
  if (weaponOption) {
    // const
  }
}

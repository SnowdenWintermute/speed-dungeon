import { CombatantProperties } from "../../combatants";
import { EquipmentSlot, WeaponSlot } from "../../items";
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
  const equipmentSlot =
    weaponSlot === WeaponSlot.MainHand ? EquipmentSlot.MainHand : EquipmentSlot.OffHand;
  const equipmentOption = userCombatantProperties.getEquipmentInSlot(equipmentSlot)!;
  if (equipmentOption) {
    const modifiedDamageRangeResult = equipmentOption.getModifiedWeaponDamageRange();
    if (!(modifiedDamageRangeResult instanceof Error)) {
      range.min += modifiedDamageRangeResult.min;
      range.max += modifiedDamageRangeResult.max;
    }
  }
}

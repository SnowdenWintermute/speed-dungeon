import { CombatantProperties } from "../../combatants";
import { EquipmentSlot, WeaponSlot } from "../../items";
import { EquipmentProperties } from "../../items/equipment/equipment-properties";
import { NumberRange } from "../../primatives/number-range";

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
  const equipmentOption = CombatantProperties.getEquipmentInSlot(
    userCombatantProperties,
    equipmentSlot
  )!;
  if (equipmentOption) {
    const modifiedDamageRangeResult =
      EquipmentProperties.getModifiedWeaponDamageRange(equipmentOption);
    if (!(modifiedDamageRangeResult instanceof Error)) {
      range.min += modifiedDamageRangeResult.min;
      range.max += modifiedDamageRangeResult.max;
    }
  }
}

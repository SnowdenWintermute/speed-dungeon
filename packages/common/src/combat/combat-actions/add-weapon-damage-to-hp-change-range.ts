import { CombatantProperties } from "../../combatants/index.js";
import { EquipmentSlot, WeaponSlot } from "../../items/index.js";
import { EquipmentProperties } from "../../items/equipment/equipment-properties/index.js";
import { NumberRange } from "../../primatives/number-range.js";

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

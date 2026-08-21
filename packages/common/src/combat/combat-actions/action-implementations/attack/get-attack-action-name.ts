import { WeaponProperties } from "../../../../items/equipment/equipment-properties/equipment-properties.js";
import { EquipmentType } from "../../../../items/equipment/equipment-types/index.js";
import { CombatActionName } from "../../combat-action-names.js";

// for showing tooltips or creating analysis reports
export function getAttackActionName(
  weaponOption: WeaponProperties | undefined,
  options: { isOffHand: boolean }
) {
  if (options.isOffHand) {
    return CombatActionName.AttackMeleeOffhand;
  }

  if (weaponOption) {
    const weaponProperties = weaponOption;
    if (weaponProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon) {
      return CombatActionName.AttackRangedMainhand;
    }
  }
  return CombatActionName.AttackMeleeMainhand;
}

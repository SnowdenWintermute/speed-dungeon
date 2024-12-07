import { CombatantProperties } from "../../../../combatants/index.js";
import { WeaponProperties } from "../../../../items/index.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";

export function getMostEffectiveWeaponKineticTypeOnTarget(
  weaponOption: undefined | WeaponProperties,
  targetCombatantProperties: CombatantProperties
): null | KineticDamageType {
  if (!weaponOption) return KineticDamageType.Blunt; // fists are blunt weapons

  const weaponProperties = weaponOption;

  const damageTypesToSelectFrom: KineticDamageType[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification) {
    if (hpChangeSource.kineticDamageTypeOption !== undefined)
      damageTypesToSelectFrom.push(hpChangeSource.kineticDamageTypeOption);
  }

  const targetAffinities =
    CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(targetCombatantProperties);
  let weakestAffinityOption: null | [KineticDamageType, number] = null;

  for (const damageType of damageTypesToSelectFrom) {
    const targetAffinityValueOption = targetAffinities[damageType];
    if (targetAffinityValueOption === undefined) {
      weakestAffinityOption = [damageType, 0];
      continue;
    }
    const targetAffinityValue = targetAffinityValueOption;
    if (weakestAffinityOption === null || targetAffinityValueOption < weakestAffinityOption[1])
      weakestAffinityOption = [damageType, targetAffinityValue];
  }

  if (weakestAffinityOption !== null) return weakestAffinityOption[0];
  return null;
}

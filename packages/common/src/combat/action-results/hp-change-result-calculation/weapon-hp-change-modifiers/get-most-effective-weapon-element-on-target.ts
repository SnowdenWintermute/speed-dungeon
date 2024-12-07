import { CombatantProperties } from "../../../../combatants/index.js";
import { WeaponProperties } from "../../../../items/index.js";
import { MagicalElement } from "../../../magical-elements.js";

export function getMostEffectiveWeaponElementOnTarget(
  weaponProperties: WeaponProperties,
  targetCombatantProperties: CombatantProperties
): null | MagicalElement {
  const elementsToSelectFrom: MagicalElement[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification) {
    if (hpChangeSource.elementOption !== undefined)
      elementsToSelectFrom.push(hpChangeSource.elementOption);
  }

  const targetAffinities =
    CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);

  let weakestAffinityOption: null | [MagicalElement, number] = null;

  for (const element of elementsToSelectFrom) {
    const targetAffinityValueOption = targetAffinities[element];
    if (targetAffinityValueOption === undefined) {
      weakestAffinityOption = [element, 0];
      continue;
    }
    const targetAffinityValue = targetAffinityValueOption;
    if (weakestAffinityOption === null || targetAffinityValueOption < weakestAffinityOption[1])
      weakestAffinityOption = [element, targetAffinityValue];
  }

  if (weakestAffinityOption !== null) return weakestAffinityOption[0];
  return null;
}

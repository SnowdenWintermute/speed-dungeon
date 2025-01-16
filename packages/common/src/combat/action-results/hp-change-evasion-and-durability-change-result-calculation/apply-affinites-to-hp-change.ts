import { CombatantProperties } from "../../../combatants/index.js";
import { HpChange } from "../../hp-change-source-types.js";

export function applyElementalAffinities(hpChange: HpChange, target: CombatantProperties) {
  const hpChangeElement = hpChange.source.elementOption;
  if (hpChangeElement === undefined) return;
  const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(target);
  const affinityValue = targetAffinities[hpChangeElement] || 0;
  hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
}

export function applyKineticAffinities(hpChange: HpChange, target: CombatantProperties) {
  const kineticDamageType = hpChange.source.kineticDamageTypeOption;
  if (kineticDamageType === undefined) return;
  const targetAffinities = CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(target);
  const affinityValue = targetAffinities[kineticDamageType] || 0;
  hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
}

export function applyAffinityToHpChange(
  affinityPercentage: number,
  hpChange: number // 10
): number {
  let multiplier = 1;
  if (affinityPercentage < 0) {
    // -25%
    multiplier = (affinityPercentage * -1) /* 25 */ / 100; /* = .25 */
    return hpChange /* 10 */ + hpChange * multiplier /* 10 * .25 = 2.5 */;
  } else if (affinityPercentage > 0 /* 25 */ && affinityPercentage <= 100) {
    multiplier = 1 - affinityPercentage / 100 /* .25 */;
    return hpChange - hpChange * multiplier;
  } else if (affinityPercentage > 100) {
    /* 150 */ const capped = Math.min(200, affinityPercentage);
    multiplier = ((capped - 100) /*50*/ / 100) /* .5 */ * -1; /* -.5 */
  }
  return hpChange * multiplier;
}

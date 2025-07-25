import { CombatantProperties } from "../../../combatants/index.js";
import { Percentage } from "../../../primatives/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";
import { KINETIC_DAMAGE_TYPE_STRINGS } from "../../kinetic-damage-types.js";

export function applyElementalAffinities(
  hpChange: ResourceChange,
  target: CombatantProperties,
  targetWantsToBeHit: boolean
) {
  const hpChangeElement = hpChange.source.elementOption;
  if (hpChangeElement === undefined) return;
  const targetAffinities = CombatantProperties.getCombatantTotalElementalAffinities(target);
  const affinityValue = targetAffinities[hpChangeElement] || 0;
  const afterAffinityApplied = applyAffinityToResourceChange(affinityValue, hpChange.value);
  // target wanted to be hit, so don't reduce the incoming value
  if (Math.abs(afterAffinityApplied) < Math.abs(hpChange.value) && targetWantsToBeHit) return;
  hpChange.value = applyAffinityToResourceChange(affinityValue, hpChange.value);
}

export function applyKineticAffinities(
  hpChange: ResourceChange,
  target: CombatantProperties,
  targetWantsToBeHit: boolean
) {
  const kineticDamageType = hpChange.source.kineticDamageTypeOption;
  if (kineticDamageType === undefined) return;
  const targetAffinities = CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(target);
  const affinityValue: Percentage = targetAffinities[kineticDamageType] || 0;

  const afterAffinityApplied = applyAffinityToResourceChange(affinityValue, hpChange.value);
  // target wanted to be hit, so don't reduce the incoming value
  if (Math.abs(afterAffinityApplied) < Math.abs(hpChange.value) && targetWantsToBeHit) return;
  hpChange.value = applyAffinityToResourceChange(affinityValue, hpChange.value);
}

export function applyAffinityToResourceChange(
  affinityPercentage: number,
  hpChange: number // 10,
): number {
  if (affinityPercentage < 0) {
    // Takes extra damage
    const multiplier = 1 + Math.abs(affinityPercentage) / 100;
    return hpChange * multiplier;
  } else if (affinityPercentage <= 100) {
    // Takes reduced damage
    const multiplier = 1 - affinityPercentage / 100;
    return hpChange * multiplier;
  } else {
    // Takes healing instead of damage
    const capped = Math.min(affinityPercentage, 200);
    const multiplier = (capped - 100) / 100;
    return -hpChange * multiplier;
  }
}

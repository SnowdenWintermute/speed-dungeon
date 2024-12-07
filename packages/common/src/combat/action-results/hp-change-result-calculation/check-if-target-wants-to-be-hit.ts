import { CombatantProperties, CombatantTraitType } from "../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";

export default function checkIfTargetWantsToBeHit(
  targetCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties
) {
  const isUndead = CombatantProperties.hasTraitType(
    targetCombatantProperties,
    CombatantTraitType.Undead
  );
  if (hpChangeProperties.hpChangeSource.isHealing && isUndead) return false;
  if (hpChangeProperties.hpChangeSource.isHealing) return true;

  const { elementOption } = hpChangeProperties.hpChangeSource;
  if (elementOption) {
    const targetAffinities =
      CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
    const targetAffinity = targetAffinities[elementOption];
    if (targetAffinity && targetAffinity > 100) return true;
  }

  return false;
}

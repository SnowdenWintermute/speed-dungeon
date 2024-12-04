import {
  BASE_CRIT_CHANCE,
  RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO,
} from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import applyAffinityToHpChange from "./apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import { HpChange } from "./index.js";
import rollCrit from "./roll-crit.js";

export default function calculateMagicalDamageHpChangesAndCrits(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  idsOfNonEvadingTargets: string[],
  incomingDamagePerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
): Error | { [entityId: string]: HpChange } {
  const hitPointChanges: { [entityId: string]: HpChange } = {};
  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  for (const targetId of idsOfNonEvadingTargets) {
    const hpChange = new HpChange(incomingDamagePerTarget, hpChangeProperties.sourceProperties);
    const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;
    const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
    const targetCombatAttributes =
      CombatantProperties.getTotalAttributes(targetCombatantProperties);
    // crits
    const userFocus = userCombatAttributes[CombatAttribute.Focus] || 0;
    const critChance = userFocus + BASE_CRIT_CHANCE;
    const isCrit = rollCrit(critChance);
    if (isCrit) {
      hpChange.value = applyCritMultiplierToHpChange(
        hpChangeProperties,
        userCombatAttributes,
        hpChange.value
      );
      hpChange.isCrit = true;
    }
    // affinities
    const hpChangeElement = hpChangeProperties.sourceProperties.elementOption;
    if (hpChangeElement !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[hpChangeElement] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }
    const physicalDamageType = hpChangeProperties.sourceProperties.physicalDamageTypeOption;
    if (physicalDamageType !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalPhysicalDamageTypeAffinities(
          targetCombatantProperties
        );
      const affinityValue = targetAffinities[physicalDamageType] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }

    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // only apply resilience damage reduction if not getting healed due to affinities
    if (hpChange.value > 0) {
      const targetResilience = targetCombatAttributes[CombatAttribute.Resilience] || 0;
      const penetratedResilience = Math.max(0, targetResilience - userFocus);
      const damageReductionPercentage = Math.min(
        100,
        penetratedResilience * RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO
      );
      const damageReductionMultiplier = 1.0 - damageReductionPercentage / 100;
      hpChange.value *= damageReductionMultiplier;
    }

    // final mods
    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // since "damage" is written as positive numbers in the action definitions
    // we convert to a negative value as the "hp change"
    hpChange.value *= -1;
    hitPointChanges[targetId] = hpChange;
  }

  return hitPointChanges;
}

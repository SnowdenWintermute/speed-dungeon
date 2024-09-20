import { ValueChangesAndCrits } from "./index.js";
import {
  BASE_CRIT_CHANCE,
  RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO,
} from "../../../app_consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import applyAffinityToHpChange from "./apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import rollCrit from "./roll-crit.js";

export default function calculateMagicalDamageHpChangesAndCrits(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  idsOfNonEvadingTargets: string[],
  incomingDamagePerTarget: number,
  hpChangeProperties: CombatActionHpChangeProperties
): Error | ValueChangesAndCrits {
  const hitPointChanges: { [entityId: string]: number } = {};
  const entitiesCrit: string[] = [];
  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);

  for (const targetId of idsOfNonEvadingTargets) {
    let hpChange = incomingDamagePerTarget;
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
      hpChange = applyCritMultiplierToHpChange(hpChangeProperties, userCombatAttributes, hpChange);
      entitiesCrit.push(targetId);
    }
    // affinities
    const hpChangeElement = hpChangeProperties.sourceProperties.elementOption;
    if (hpChangeElement !== null) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[hpChangeElement] || 0;
      hpChange = applyAffinityToHpChange(affinityValue, hpChange);
    }
    const physicalDamageType = hpChangeProperties.sourceProperties.physicalDamageTypeOption;
    if (physicalDamageType !== null) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalPhysicalDamageTypeAffinities(
          targetCombatantProperties
        );
      const affinityValue = targetAffinities[physicalDamageType] || 0;
      hpChange = applyAffinityToHpChange(affinityValue, hpChange);
    }

    hpChange *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // only apply resilience damage reduction if not getting healed due to affinities
    if (hpChange > 0) {
      const targetResilience = targetCombatAttributes[CombatAttribute.Resilience] || 0;
      const penetratedResilience = Math.max(0, targetResilience - userFocus);
      const damageReductionPercentage = Math.min(
        100,
        penetratedResilience * RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO
      );
      const damageReductionMultiplier = 1.0 - damageReductionPercentage / 100;
      hpChange *= damageReductionMultiplier;
    }

    // final mods
    hpChange *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // since "damage" is written as positive numbers in the action definitions
    // we convert to a negative value as the "hp change"
    hpChange *= -1;
    hitPointChanges[targetId] = hpChange;
  }

  return {
    valueChangesByEntityId: hitPointChanges,
    entityIdsCrit: entitiesCrit,
  };
}

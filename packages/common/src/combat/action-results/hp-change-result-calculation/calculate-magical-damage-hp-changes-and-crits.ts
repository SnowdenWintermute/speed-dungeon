import {
  BASE_CRIT_CHANCE,
  RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO,
} from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import applyAffinityToHpChange from "./apply-affinity-to-hp-change.js";
import applyCritMultiplierToHpChange from "./apply-crit-multiplier-to-hp-change.js";
import getDamageAfterResilience from "./get-damage-after-resilience.js";
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
    const hpChange = new HpChange(incomingDamagePerTarget, hpChangeProperties.hpChangeSource);
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
    const hpChangeElement = hpChangeProperties.hpChangeSource.elementOption;
    if (hpChangeElement !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalElementalAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[hpChangeElement] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }
    const kineticDamageType = hpChangeProperties.hpChangeSource.kineticDamageTypeOption;
    if (kineticDamageType !== undefined) {
      const targetAffinities =
        CombatantProperties.getCombatantTotalKineticDamageTypeAffinities(targetCombatantProperties);
      const affinityValue = targetAffinities[kineticDamageType] || 0;
      hpChange.value = applyAffinityToHpChange(affinityValue, hpChange.value);
    }

    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // only apply resilience damage reduction if not getting healed due to affinities
    if (hpChange.value > 0)
      hpChange.value = getDamageAfterResilience(
        hpChange.value,
        userCombatAttributes,
        targetCombatAttributes
      );

    // final mods
    hpChange.value *= hpChangeProperties.finalDamagePercentMultiplier / 100;

    // since "damage" is written as positive numbers in the action definitions
    // we convert to a negative value as the "hp change"
    hpChange.value *= -1;
    hitPointChanges[targetId] = hpChange;
  }

  return hitPointChanges;
}

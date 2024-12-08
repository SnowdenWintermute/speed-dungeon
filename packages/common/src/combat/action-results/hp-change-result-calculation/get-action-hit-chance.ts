import { MIN_HIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { randBetween } from "../../../utils/index.js";
import { CombatAction, CombatActionProperties } from "../../index.js";

export function getActionHitChance(
  combatActionProperties: CombatActionProperties,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  unavoidable: boolean,
  targetWantsToBeHit: boolean
): number {
  if (unavoidable) return 100;

  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const userAccuracy = userCombatAttributes[CombatAttribute.Accuracy];
  const targetCombatAttributes = CombatantProperties.getTotalAttributes(targetCombatantProperties);
  const targetEvasion = targetWantsToBeHit ? 0 : targetCombatAttributes[CombatAttribute.Evasion];
  const accComparedToEva = userAccuracy - targetEvasion;
  let percentChangeToHit = Math.max(MIN_HIT_CHANCE, accComparedToEva);
  percentChangeToHit = Math.max(
    MIN_HIT_CHANCE,
    percentChangeToHit * (combatActionProperties.accuracyPercentModifier / 100)
  );

  return percentChangeToHit;
}

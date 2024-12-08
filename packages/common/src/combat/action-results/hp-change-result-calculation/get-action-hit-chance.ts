import { MIN_HIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { CombatActionProperties } from "../../index.js";

export function getActionHitChance(
  combatActionProperties: CombatActionProperties,
  userCombatantProperties: CombatantProperties,
  targetEvasion: number,
  unavoidable: boolean,
  targetWantsToBeHit: boolean
): number {
  if (unavoidable) return 100;

  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const userAccuracy = userCombatAttributes[CombatAttribute.Accuracy];
  const modifiedAccuracy = userAccuracy * (combatActionProperties.accuracyPercentModifier / 100);
  const finalTargetEvasion = targetWantsToBeHit ? 0 : targetEvasion;
  const accComparedToEva = modifiedAccuracy - finalTargetEvasion;

  return Math.min(100, Math.max(MIN_HIT_CHANCE, accComparedToEva));
}

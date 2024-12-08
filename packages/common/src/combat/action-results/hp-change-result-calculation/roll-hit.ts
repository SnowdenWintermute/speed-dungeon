import { MIN_HIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute, CombatantProperties } from "../../../combatants/index.js";
import { randBetween } from "../../../utils/index.js";

export function rollHit(
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  unavoidable: boolean,
  targetWantsToBeHit: boolean
) {
  if (unavoidable) return true;

  const userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const userAccuracy = userCombatAttributes[CombatAttribute.Accuracy];
  const targetCombatAttributes = CombatantProperties.getTotalAttributes(targetCombatantProperties);
  const targetEvasion = targetWantsToBeHit ? 0 : targetCombatAttributes[CombatAttribute.Evasion];
  const accComparedToEva = userAccuracy - targetEvasion;
  const percentChangeToHit = Math.max(MIN_HIT_CHANCE, accComparedToEva);
  const hitRoll = randBetween(0, 100);

  return hitRoll <= percentChangeToHit;
}

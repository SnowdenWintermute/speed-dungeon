import { MIN_HIT_CHANCE } from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { ActionAccuracyType } from "../../combat-actions/combat-action-accuracy.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function getActionHitChance(
  combatAction: CombatActionComponent,
  userCombatantProperties: CombatantProperties,
  targetEvasion: number,
  targetWantsToBeHit: boolean
): number {
  const actionBaseAccuracy = combatAction.getAccuracy(userCombatantProperties);
  if (actionBaseAccuracy.type === ActionAccuracyType.Unavoidable) return 100;

  const finalTargetEvasion = targetWantsToBeHit ? 0 : targetEvasion;
  const accComparedToEva = actionBaseAccuracy.value - finalTargetEvasion;

  return Math.max(MIN_HIT_CHANCE, accComparedToEva);
}

import { MAX_CRIT_CHANCE } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function getActionCritChance(
  action: CombatActionComponent,
  user: CombatantProperties,
  target: CombatantProperties,
  targetWantsToBeHit: boolean
) {
  const actionBaseCritChance = action.getCritChance(user);

  const targetAttributes = CombatantProperties.getTotalAttributes(target);
  const targetAvoidaceAttributeValue = targetAttributes[CombatAttribute.Resilience];

  const targetCritAvoidance = targetWantsToBeHit ? 0 : targetAvoidaceAttributeValue;
  const finalUnroundedCritChance = actionBaseCritChance - targetCritAvoidance;

  return Math.floor(Math.max(0, Math.min(MAX_CRIT_CHANCE, finalUnroundedCritChance)));
}

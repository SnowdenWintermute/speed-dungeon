import { CombatantProperties } from "../../../../../combatants/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../../../utils/index.js";
import { ActionPayableResource, CombatActionComponent } from "../../../index.js";

export function getStandardActionCost(
  user: CombatantProperties,
  inCombat: boolean,
  actionLevel: number,
  self: CombatActionComponent
) {
  // we may need to check costs of actions they don't technically own,
  // such as "attack melee offhand" which is a triggered child action but
  // not actually an action they can "own" or ask to use independantly

  let toReturn: Partial<Record<ActionPayableResource, number>> | null = {};
  const { costBases } = self.costProperties;

  for (const [payableResourceType, costBase] of iterateNumericEnumKeyedRecord(costBases)) {
    if (payableResourceType === ActionPayableResource.ActionPoints && !inCombat) continue;
    let cost = costBase.base;

    if (costBase.multipliers) {
      if (costBase.multipliers.actionLevel) cost *= costBase.multipliers.actionLevel * actionLevel;
      if (costBase.multipliers.userCombatantLevel)
        cost *= costBase.multipliers.userCombatantLevel * user.level;
    }

    if (costBase.additives) {
      if (costBase.additives.actionLevel) cost += costBase.additives.actionLevel * actionLevel;
      if (costBase.additives.userCombatantLevel)
        cost += costBase.additives.userCombatantLevel * user.level;
    }

    cost = Math.floor(cost);
    cost *= -1;

    toReturn[payableResourceType] = cost;
  }

  if (Object.keys(toReturn).length === 0) toReturn = null;

  return toReturn;
}

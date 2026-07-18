import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { iterateNumericEnumKeyedRecord } from "../../../../../utils/index.js";
import { ActionPayableResource, ActionResourceCosts } from "../../../action-calculation-utils/action-costs.js";
import { CombatActionComponent } from "../../../index.js";
import { ActionRank } from "../../../../../aliases.js";

export function getStandardActionCost(
  _user: IActionUser,
  inCombat: boolean,
  actionRank: ActionRank,
  self: CombatActionComponent
): ActionResourceCosts | null {
  // we may need to check costs of actions they don't technically own,
  // such as "attack melee offhand" which is a triggered child action but
  // not actually an action they can "own" or ask to use independantly

  const costsForRank = self.costProperties.costsByRank[actionRank];
  if (costsForRank === undefined) {
    return null;
  }

  const toReturn: ActionResourceCosts = {};

  for (const [payableResourceType, cost] of iterateNumericEnumKeyedRecord(costsForRank)) {
    if (payableResourceType === ActionPayableResource.ActionPoints && !inCombat) {
      continue;
    }
    toReturn[payableResourceType] = cost * -1;
  }

  if (Object.keys(toReturn).length === 0) {
    return null;
  }

  return toReturn;
}

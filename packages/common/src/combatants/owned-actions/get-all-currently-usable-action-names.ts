import { CombatantProperties } from "../index.js";
import { CombatActionUsabilityContext } from "../../combat/combat-actions/combat-action-usable-cotexts.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { getUnmetCostResourceTypes } from "../../combat/combat-actions/index.js";

export function getAllCurrentlyUsableActionNames(
  combatantProperties: CombatantProperties,
  currentUsabilityContext: CombatActionUsabilityContext
) {
  const usableActions: CombatActionName[] = [];

  for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(
    combatantProperties.ownedActions
  )) {
    const action = COMBAT_ACTIONS[actionName];
    if (!action.isUsableInGivenContext(currentUsabilityContext)) continue;

    const costs = action.costProperties.getResourceCosts(combatantProperties);
    if (costs) {
      const unmetCosts = getUnmetCostResourceTypes(combatantProperties, costs);
      if (unmetCosts.length) continue;
    }

    usableActions.push(actionName);
  }

  return usableActions;
}

import { CombatantProperties } from "../index.js";
import { CombatActionUsabilityContext } from "../../combat/combat-actions/combat-action-usable-cotexts.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";

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

    // @TODO - check if combatant has the required resources

    usableActions.push(actionName);
  }

  return usableActions;
}

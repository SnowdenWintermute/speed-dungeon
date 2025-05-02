import { CombatantProperties } from "../index.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatActionUsabilityContext } from "../../combat/combat-actions/combat-action-usable-cotexts.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";

export function getActionNamesFilteredByUseableContext(
  combatantProperties: CombatantProperties,
  currentContext: CombatActionUsabilityContext
): CombatActionName[] {
  const toReturn: CombatActionName[] = [];

  for (const [actionName, _actionState] of iterateNumericEnumKeyedRecord(
    combatantProperties.ownedActions
  )) {
    const action = COMBAT_ACTIONS[actionName];
    if (action.isUsableInGivenContext(currentContext)) toReturn.push(actionName);
  }

  return toReturn;
}

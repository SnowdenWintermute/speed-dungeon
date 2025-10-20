import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatActionUsabilityContext } from "../../combat/combat-actions/combat-action-usable-cotexts.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export function getActionNamesFilteredByUseableContext(
  combatantProperties: CombatantProperties,
  currentContext: CombatActionUsabilityContext
): CombatActionName[] {
  const toReturn: CombatActionName[] = [];

  for (const [actionName, _actionState] of iterateNumericEnumKeyedRecord(
    combatantProperties.abilityProperties.getOwnedActions()
  )) {
    const action = COMBAT_ACTIONS[actionName];
    if (action.isUsableInGivenContext(currentContext)) toReturn.push(actionName);
  }

  return toReturn;
}

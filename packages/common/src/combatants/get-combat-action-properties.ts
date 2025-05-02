import { CombatantProperties } from "./index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  actionName: CombatActionName
): Error | CombatActionComponent {
  const actionOption = combatantProperties.ownedActions[actionName];
  if (actionOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
  return COMBAT_ACTIONS[actionName];
}

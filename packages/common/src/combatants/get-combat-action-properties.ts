import { CombatantProperties } from "./index.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import { ActionAndRank } from "../combatant-context/action-user-targeting-properties.js";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  actionAndRank: ActionAndRank
): Error | CombatActionComponent {
  const { actionName, rank } = actionAndRank;
  const actionOption = combatantProperties.abilityProperties.ownedActions[actionName];
  if (actionOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
  if (actionOption.level < rank)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED_AT_THAT_LEVEL);
  return COMBAT_ACTIONS[actionName];
}

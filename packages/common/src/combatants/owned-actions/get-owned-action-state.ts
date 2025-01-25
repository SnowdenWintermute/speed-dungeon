import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantProperties } from "../index.js";
import { CombatantActionState } from "./combatant-action-state.js";

export function getOwnedActionState(
  combatantProperties: CombatantProperties,
  actionName: CombatActionName
): Error | CombatantActionState {
  const ownedActionStateOption = combatantProperties.ownedActions[actionName];
  if (!ownedActionStateOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
  return ownedActionStateOption;
}

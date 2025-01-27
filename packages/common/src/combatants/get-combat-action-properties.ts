import { CombatantProperties } from "./index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  actionName: CombatActionName
): Error | CombatActionComponent {
  return new Error("not implemented");
}

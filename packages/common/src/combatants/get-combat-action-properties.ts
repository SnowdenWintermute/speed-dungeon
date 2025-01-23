import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantProperties } from "./index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatActionComponent } from "../combat/combat-actions/index.js";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  actionName: CombatActionName
): Error | CombatActionComponent {
  return new Error("not implemented");
}

// for getting properties of consumables on the ground for example
export function getCombatActionProperties(
  party: AdventuringParty,
  actionName: CombatActionName,
  actionUserId: string
) {
  return new Error("not implemented");
}

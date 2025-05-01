import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function copyTargetFromParent(
  combatantContext: CombatantContext,
  combatAction: CombatActionComponent
) {
  const parent = combatAction.getParent();
  if (parent) return parent.targetingProperties.getAutoTarget(combatantContext, null);
  return null;
}

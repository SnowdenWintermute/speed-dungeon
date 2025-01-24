import { CharacterAssociatedData, CombatantAssociatedData } from "../../../types.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function copyTargetFromParent(
  combatantContext: CombatantAssociatedData,
  combatAction: CombatActionComponent
) {
  const parent = combatAction.getParent();
  if (parent) return parent.getAutoTarget(combatantContext);
  return null;
}

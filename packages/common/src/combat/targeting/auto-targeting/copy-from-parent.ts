import { CharacterAssociatedData } from "../../../types.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

export function copyTargetFromParent(
  characterAssociatedData: CharacterAssociatedData,
  combatAction: CombatActionComponent
) {
  const parent = combatAction.getParent();
  if (parent) return parent.getAutoTarget(characterAssociatedData, combatAction);
  return null;
}

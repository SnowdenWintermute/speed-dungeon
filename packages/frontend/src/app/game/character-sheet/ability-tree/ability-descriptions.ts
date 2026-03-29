import { COMBAT_ACTIONS, CombatActionName, iterateNumericEnum } from "@speed-dungeon/common";
import { ActionDescription } from "./action-description";

export const COMBAT_ACTION_DESCRIPTIONS: Record<CombatActionName, ActionDescription> = (() => {
  const descriptions: Partial<Record<CombatActionName, ActionDescription>> = {};
  for (const actionName of iterateNumericEnum(CombatActionName)) {
    descriptions[actionName] = new ActionDescription(COMBAT_ACTIONS[actionName]);
  }
  return descriptions as Record<CombatActionName, ActionDescription>;
})();

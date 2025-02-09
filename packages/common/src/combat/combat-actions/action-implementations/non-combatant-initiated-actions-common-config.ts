import { Vector3 } from "@babylonjs/core";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatActionExecutionIntent } from "../combat-action-execution-intent.js";
import { CombatActionComponent } from "../index.js";

export const NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG = {
  getPositionToStartUse: (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) => {
    return Vector3.Zero();
  },
  getDestinationDuringUse: (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) => {
    return Vector3.Zero();
  },
};

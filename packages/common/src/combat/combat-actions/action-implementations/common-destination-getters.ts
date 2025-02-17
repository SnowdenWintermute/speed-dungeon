import { Vector3 } from "@babylonjs/core";
import { ActionMotionPhase } from "../../../action-processing/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatActionExecutionIntent } from "../combat-action-execution-intent.js";

export const COMMON_DESTINATION_GETTERS: Partial<
  Record<
    ActionMotionPhase,
    (
      combatantContext: CombatantContext,
      actionExecutionIntent: CombatActionExecutionIntent
    ) => Error | null | Vector3
  >
> = {
  [ActionMotionPhase.Final]: (combatantContext, actionExecutionIntent) =>
    combatantContext.combatant.combatantProperties.homeLocation.clone(),
};

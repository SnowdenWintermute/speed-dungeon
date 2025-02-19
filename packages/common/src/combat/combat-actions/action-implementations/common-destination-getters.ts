import { Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
} from "../../../action-processing/index.js";

export const COMMON_DESTINATION_GETTERS: Partial<
  Record<ActionMotionPhase, (context: ActionResolutionStepContext) => Error | null | Vector3>
> = {
  [ActionMotionPhase.Final]: (context) => {
    const { combatantContext, tracker } = context;
    return combatantContext.combatant.combatantProperties.homeLocation.clone();
  },
};

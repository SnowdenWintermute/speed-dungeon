import { Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
} from "../../../action-processing/index.js";

export const COMMON_DESTINATION_GETTERS: Partial<
  Record<
    ActionMotionPhase,
    (
      context: ActionResolutionStepContext
    ) => Error | null | { destination: Vector3; rotateToFace?: Vector3 }
  >
> = {
  [ActionMotionPhase.Final]: (context) => {
    const { combatantContext, tracker } = context;

    const { combatantProperties } = combatantContext.combatant;

    return {
      destination: combatantProperties.homeLocation.clone(),
      rotateToFace: Vector3.Zero(),
    };
  },
};

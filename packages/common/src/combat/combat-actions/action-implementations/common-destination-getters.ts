import {
  ActionMotionPhase,
  ActionResolutionStepContext,
  EntityDestination,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";

export const COMMON_DESTINATION_GETTERS: Partial<
  Record<
    ActionMotionPhase,
    (context: ActionResolutionStepContext) => Error | null | EntityDestination
  >
> = {
  [ActionMotionPhase.Final]: (context) => {
    const { combatantContext } = context;

    const { combatantProperties } = combatantContext.combatant;

    const toReturn: EntityDestination = {
      position: combatantProperties.homeLocation.clone(),
      rotation: combatantProperties.homeRotation.clone(),
    };

    return toReturn;
  },
};

export function getHomeDestination(context: ActionResolutionStepContext) {
  const { combatantContext } = context;
  const { combatantProperties } = combatantContext.combatant;

  const toReturn: EntityDestination = {
    position: combatantProperties.homeLocation.clone(),
    rotation: combatantProperties.homeRotation.clone(),
  };

  return toReturn;
}

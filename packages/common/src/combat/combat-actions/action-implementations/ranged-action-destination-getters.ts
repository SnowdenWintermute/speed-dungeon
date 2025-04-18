import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
  EntityDestination,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { COMMON_DESTINATION_GETTERS } from "./common-destination-getters.js";

export const RANGED_ACTION_DESTINATION_GETTERS: Partial<
  Record<
    ActionMotionPhase,
    (context: ActionResolutionStepContext) => Error | null | EntityDestination
  >
> = {
  ...COMMON_DESTINATION_GETTERS,
  [ActionMotionPhase.Initial]: (context: ActionResolutionStepContext) => {
    const { combatantContext } = context;
    const user = combatantContext.combatant.combatantProperties;
    const direction = CombatantProperties.getForward(user);
    return { position: user.homeLocation.add(direction.scale(0.5)) };
  },
  [ActionMotionPhase.Chambering]: (context: ActionResolutionStepContext) => {
    const { combatantContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      combatantContext.party,
      actionExecutionIntent
    );

    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult;

    const direction = target.combatantProperties.homeLocation
      .subtract(combatantContext.combatant.combatantProperties.homeLocation)
      .normalize();

    const destinationRotation = Quaternion.FromUnitVectorsToRef(
      new Vector3(0, 0, 1),
      direction,
      new Quaternion()
    );

    return {
      rotation: destinationRotation,
    };
  },
};

import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { COMMON_DESTINATION_GETTERS } from "./common-destination-getters.js";
import { COMMON_CHILD_ACTION_STEPS_SEQUENCE } from "./common-action-steps-sequence.js";

const meleeRange = 1.5;
const threshold = 0.01;

export const MELEE_ATTACK_COMMON_CONFIG = {
  userShouldMoveHomeOnComplete: true,
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  // getResolutionSteps: () => COMMON_CHILD_ACTION_STEPS_SEQUENCE,
  // motionPhasePositionGetters: {
  //   ...COMMON_DESTINATION_GETTERS,
  //   [ActionMotionPhase.Initial]: (context: ActionResolutionStepContext) => {
  //     const { combatantContext, tracker } = context;
  //     const { actionExecutionIntent } = tracker;
  //     const targetingCalculator = new TargetingCalculator(combatantContext, null);
  //     const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
  //       combatantContext.party,
  //       actionExecutionIntent
  //     );
  //     if (primaryTargetResult instanceof Error) return primaryTargetResult;
  //     const target = primaryTargetResult;
  //     const user = combatantContext.combatant.combatantProperties;

  //     const distance = Vector3.Distance(target.combatantProperties.position, user.position);
  //     if (
  //       distance <= meleeRange ||
  //       isNaN(distance) ||
  //       Math.abs(meleeRange - distance) < threshold
  //     ) {
  //       return { position: user.position.clone() };
  //     }

  //     const direction = target.combatantProperties.homeLocation
  //       .subtract(combatantContext.combatant.combatantProperties.homeLocation)
  //       .normalize();

  //     const destination = target.combatantProperties.homeLocation.subtract(
  //       // direction.scale(target.hitboxRadius + user.hitboxRadius)
  //       direction.scale(meleeRange)
  //     );

  //     const destinationRotation = Quaternion.FromUnitVectorsToRef(
  //       CombatantProperties.getForward(user),
  //       // user.homeLocation,
  //       direction,
  //       new Quaternion()
  //     );

  //     return {
  //       position: destination,
  //       rotation: destinationRotation,
  //     };
  //   },
  //   [ActionMotionPhase.Delivery]: (context: ActionResolutionStepContext) => {
  //     const { combatantContext, tracker } = context;
  //     const { actionExecutionIntent } = tracker;
  //     const targetingCalculator = new TargetingCalculator(combatantContext, null);
  //     const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
  //       combatantContext.party,
  //       actionExecutionIntent
  //     );
  //     if (primaryTargetResult instanceof Error) return primaryTargetResult;
  //     const target = primaryTargetResult;
  //     const user = combatantContext.combatant.combatantProperties;

  //     return { position: user.position.clone() };

  //     // const distance = Vector3.Distance(target.position, user.position);
  //     // if (
  //     //   distance <= meleeRange ||
  //     //   isNaN(distance) ||
  //     //   Math.abs(meleeRange - distance) < threshold
  //     // ) {
  //     //   return user.position.clone();
  //     // }

  //     // const toTravel = distance - meleeRange;

  //     // const direction = target.position
  //     //   .subtract(combatantContext.combatant.combatantProperties.position)
  //     //   .normalize();

  //     // return user.position.add(direction.scale(toTravel));
  //   },
  // },
};

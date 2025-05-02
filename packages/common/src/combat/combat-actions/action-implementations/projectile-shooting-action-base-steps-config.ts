import { ActionResolutionStepType, AnimationTimingType } from "../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";
import { ActionExecutionPhase } from "./action-execution-phase.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "./common-destination-getters.js";
import { getSpeciesTimedAnimation } from "./get-species-timed-animation.js";
import {
  PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES,
  ProjectileShootingActionType,
} from "./projectile-shooting-action-animation-names.js";

export function getProjectileShootingActionBaseStepsConfig(
  projectileActionType: ProjectileShootingActionType
) {
  const animationNames = PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES[projectileActionType];

  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineMeleeActionAnimations]: {},

      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getStepForwardDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getDestination: getRotateTowardPrimaryTargetDestination,
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Chambering]
          ),
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Delivery]
          ),
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.StartConcurrentSubActions]: {},

      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Recovery]
          ),
      },

      [ActionResolutionStepType.FinalPositioning]: {
        getDestination: getHomeDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
    },
    { userShouldMoveHomeOnComplete: true }
  );
}

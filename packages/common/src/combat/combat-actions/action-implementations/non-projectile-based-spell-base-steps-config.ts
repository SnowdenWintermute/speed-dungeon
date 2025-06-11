import { ActionResolutionStepType, AnimationTimingType } from "../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "./common-destination-getters.js";
import { getSpeciesTimedAnimation } from "./get-species-timed-animation.js";

export function getNonProjectileBasedSpellBaseStepsConfig() {
  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getStepForwardDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
            smoothTransition: true,
          };
        },
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getDestination: getRotateTowardPrimaryTargetDestination,
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            SkeletalAnimationName.CastSpellChambering,
            false
          ),
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            SkeletalAnimationName.CastSpellDelivery,
            false
          ),
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},

      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            SkeletalAnimationName.CastSpellRecovery,
            false
          ),
      },

      [ActionResolutionStepType.FinalPositioning]: {
        getDestination: getHomeDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
            smoothTransition: true,
          };
        },
      },
    },
    { userShouldMoveHomeOnComplete: true }
  );
}

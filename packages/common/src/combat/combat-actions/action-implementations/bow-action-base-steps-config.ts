import { ActionResolutionStepType, AnimationTimingType } from "../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "./common-destination-getters.js";
import { getSpeciesTimedAnimation } from "./get-species-timed-animation.js";

export const BOW_ACTION_BASE_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineActionAnimations]: {},
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
        getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowChambering),
    },
    [ActionResolutionStepType.PostChamberingSpawnEntity]: {},
    [ActionResolutionStepType.DeliveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowDelivery),
    },
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.StartConcurrentSubActions]: {},
    [ActionResolutionStepType.RecoveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.BowRecovery),
    },
    [ActionResolutionStepType.FinalPositioning]: {
      isConditionalStep: true,
      getDestination: getHomeDestination,
      getAnimation: () => {
        return {
          name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
          timing: { type: AnimationTimingType.Looping },
        };
      },
    },
  },
  true
);

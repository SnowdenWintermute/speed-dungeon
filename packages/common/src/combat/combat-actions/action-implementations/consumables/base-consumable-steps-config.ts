import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "../common-destination-getters.js";
import { getTimedSkeletalEntityAnimation } from "../get-entity-animation.js";

export const MEDICATION_ACTION_BASE_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
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
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableChambering
        ),
    },
    [ActionResolutionStepType.DeliveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableDelivery
        ),
    },
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    [ActionResolutionStepType.RecoveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableRecovery
        ),
    },
    [ActionResolutionStepType.FinalPositioning]: {
      isConditionalStep: true,
      getAnimation: () => {
        return {
          name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
          timing: { type: AnimationTimingType.Looping },
        };
      },
      getDestination: getHomeDestination,
    },
  },
  { userShouldMoveHomeOnComplete: true }
);

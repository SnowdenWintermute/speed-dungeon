import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "../../common-destination-getters.js";

export const RANGED_SKILL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
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
    },
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.StartConcurrentSubActions]: {},
    // [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
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

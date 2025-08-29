import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { SkeletalAnimationName } from "../../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
} from "../common-destination-getters.js";
import { getTimedSkeletalEntityAnimation } from "../get-entity-animation.js";

export const MEDICATION_ACTION_BASE_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.InitialPositioning]: {},
    [ActionResolutionStepType.ChamberingMotion]: {
      getDestination: getRotateTowardPrimaryTargetDestination,
      getAnimation: (user, animationLengths) =>
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableChambering,
          true
        ),
    },
    [ActionResolutionStepType.DeliveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableDelivery,
          false
        ),
    },
    [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.RecoveryMotion]: {
      getAnimation: (user, animationLengths) =>
        getTimedSkeletalEntityAnimation(
          user,
          animationLengths,
          SkeletalAnimationName.UseConsumableRecovery,
          false
        ),
    },
    [ActionResolutionStepType.FinalPositioning]: {
      isConditionalStep: true,
      getDestination: getHomeDestination,
      shouldIdleOnComplete: true,
    },
  },
  { userShouldMoveHomeOnComplete: true }
);

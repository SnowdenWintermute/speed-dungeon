import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { SkeletalAnimationName } from "../../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { getHomeDestination } from "../common-destination-getters.js";
import { getSpeciesLoopingAnimation } from "../get-species-timed-animation.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
  },
  {
    [ActionResolutionStepType.FinalPositioning]: {
      getDestination: (context) => getHomeDestination(context),
      getAnimation: (user, animationLengths) =>
        getSpeciesLoopingAnimation(user, SkeletalAnimationName.IdleFlying, true),
    },
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self: ActionResolutionStepsConfig) => {
      return self.finalSteps;
    },
  }
);

export const START_FLYING_STEPS_CONFIG = config;

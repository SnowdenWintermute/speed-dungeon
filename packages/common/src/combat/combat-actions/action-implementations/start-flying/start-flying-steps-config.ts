import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
  },
  {
    [ActionResolutionStepType.BattleResolution]: {},
    [ActionResolutionStepType.FinalPositioning]: {},
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self: ActionResolutionStepsConfig) => {
      return self.finalSteps;
    },
  }
);

export const START_FLYING_STEPS_CONFIG = config;

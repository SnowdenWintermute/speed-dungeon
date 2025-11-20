import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
  },
  {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self: ActionResolutionStepsConfig) => {
      return self.finalSteps;
    },
  }
);

export const SUMMON_COMBATANT_STEPS_CONFIG = config;

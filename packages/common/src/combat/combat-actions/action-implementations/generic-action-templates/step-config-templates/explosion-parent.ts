import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.OnActivationSpawnEntity]: {},
    [ActionResolutionStepType.StartConcurrentSubActions]: {},
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

export const EXPLOSION_PARENT_STEPS_CONFIG = config;

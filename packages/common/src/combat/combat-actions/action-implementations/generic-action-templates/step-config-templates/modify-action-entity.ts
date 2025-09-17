import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

export const MODIFY_ACTION_ENTITY_ACTION_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.OnActivationActionEntityMotion]: {},
    [ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
  },
  {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  { getFinalSteps: (self) => self.finalSteps }
);

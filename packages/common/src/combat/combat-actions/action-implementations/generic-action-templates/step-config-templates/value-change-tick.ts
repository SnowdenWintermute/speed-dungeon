import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

export const VALUE_CHANGE_TICK_ACTION_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
  },
  {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  { getFinalSteps: (self) => self.finalSteps }
);

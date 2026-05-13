import { ActionResolutionStepType } from "../../../../../action-processing/action-steps/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
    // [ActionResolutionStepType.OnActivationSpawnEntity]: {},
    [ActionResolutionStepType.OnActivationActionEntityMotion]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
  },
  {
    [ActionResolutionStepType.BattleResolution]: {},
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.ActionEntityDissipationMotion]: {},
  },
  {
    getFinalSteps: (self: ActionResolutionStepsConfig) => {
      return self.finalSteps;
    },
  }
);

export const EXPLOSION_ENTITY_STEPS_CONFIG = config;

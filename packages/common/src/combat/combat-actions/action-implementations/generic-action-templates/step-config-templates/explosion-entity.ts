import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
    [ActionResolutionStepType.OnActivationSpawnEntity]: {},
    [ActionResolutionStepType.OnActivationActionEntityMotion]: {},
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.ActionEntityDissipationMotion]: {
      shouldDespawnOnComplete: () => true,
    },
  },
  { userShouldMoveHomeOnComplete: false }
);

export const EXPLOSION_ENTITY_STEPS_CONFIG = config;

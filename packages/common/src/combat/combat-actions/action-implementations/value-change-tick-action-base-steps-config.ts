import { ActionResolutionStepType } from "../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";

export function getValueChangeTickActionBasedSpellBaseStepsConfig() {
  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      // [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      // [ActionResolutionStepType.OnActivationActionEntityMotion]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
      // [ActionResolutionStepType.ActionEntityDissipationMotion]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  );
}

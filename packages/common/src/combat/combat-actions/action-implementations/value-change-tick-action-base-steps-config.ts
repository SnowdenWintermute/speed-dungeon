import { ActionResolutionStepType } from "../../../action-processing/index.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";

export function getValueChangeTickActionBasedSpellBaseStepsConfig() {
  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.InitialPositioning]: {},
      [ActionResolutionStepType.ChamberingMotion]: {},
      [ActionResolutionStepType.DeliveryMotion]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
      [ActionResolutionStepType.RecoveryMotion]: {},
      [ActionResolutionStepType.FinalPositioning]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  );
}

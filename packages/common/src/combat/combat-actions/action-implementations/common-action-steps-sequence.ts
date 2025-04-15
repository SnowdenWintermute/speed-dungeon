import { ActionResolutionStepType } from "../../../action-processing/index.js";

export const COMMON_ROOT_ACTION_STEPS_SEQUENCE = [
  ActionResolutionStepType.DetermineActionAnimations,
  ActionResolutionStepType.InitialPositioning,
  ActionResolutionStepType.ChamberingMotion,
  ActionResolutionStepType.DeliveryMotion,
  ActionResolutionStepType.PayResourceCosts,
  ActionResolutionStepType.EvalOnUseTriggers,
  ActionResolutionStepType.StartConcurrentSubActions,
  ActionResolutionStepType.RecoveryMotion,
  // ActionResolutionStepType.FinalPositioning, - should be auto-added in the processing loop
];

export const COMMON_CHILD_ACTION_STEPS_SEQUENCE = [
  ActionResolutionStepType.DetermineActionAnimations,
  ActionResolutionStepType.InitialPositioning,
  ActionResolutionStepType.ChamberingMotion,
  ActionResolutionStepType.DeliveryMotion,
  ActionResolutionStepType.PayResourceCosts,
  ActionResolutionStepType.EvalOnUseTriggers,
  ActionResolutionStepType.RollIncomingHitOutcomes,
  ActionResolutionStepType.EvalOnHitOutcomeTriggers,
  ActionResolutionStepType.RecoveryMotion,
];

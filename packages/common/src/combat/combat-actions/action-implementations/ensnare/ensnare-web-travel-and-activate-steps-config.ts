import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.DeliveryMotion]: {
      getDestination: getPrimaryTargetPositionAsDestination,
      getNewParent: () => null,
    },
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
  },
  {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self) => {
      return self.finalSteps;
    },
  }
);

export const ENSNARE_WEB_TRAVEL_AND_ACTIVATE_STEPS_CONFIG = config;

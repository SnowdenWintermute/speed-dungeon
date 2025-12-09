import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  CombatantBaseChildTransformNodeName,
  CurveType,
  SceneEntityType,
  TargetingCalculator,
} from "../../../../index.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.DeliveryMotion]: {
      getDestination: (context) => {
        const primaryTargetDestination = getPrimaryTargetPositionAsDestination(context);
        return {
          ...primaryTargetDestination,
          translationSpeedCurveOption: CurveType.EaseOut,
          translationPathCurveOption: CurveType.GradualToPeakThenSharpDrop,
        };
      },

      getNewParent: () => null,
    },
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
  },
  {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.FinalPositioning]: {
      getNewParent: (context) => {
        const { actionUserContext, tracker } = context;
        const { actionExecutionIntent } = tracker;

        const targetingCalculator = new TargetingCalculator(actionUserContext, null);
        const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
          actionUserContext.party,
          actionExecutionIntent
        );
        if (primaryTargetResult instanceof Error) throw primaryTargetResult;
        const target = primaryTargetResult;

        return {
          identifier: {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: target.getEntityId(),
            },
            transformNodeName: CombatantBaseChildTransformNodeName.EntityRoot,
          },
          duration: 0,
        };
      },
    },
  },
  {
    getFinalSteps: (self) => {
      return self.finalSteps;
    },
  }
);

export const ENSNARE_WEB_TRAVEL_AND_ACTIVATE_STEPS_CONFIG = config;

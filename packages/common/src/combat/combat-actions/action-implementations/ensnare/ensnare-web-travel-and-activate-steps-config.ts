import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  CombatantBaseChildTransformNodeName,
  CurveType,
  SceneEntityType,
  SkeletalAnimationName,
  TargetingCalculator,
} from "../../../../index.js";
import { getSpeciesTimedAnimation } from "../get-species-timed-animation.js";
import { Quaternion } from "@babylonjs/core";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.DeliveryMotion]: {
      getDestination: (context) => {
        const primaryTargetDestination = getPrimaryTargetPositionAsDestination(context);
        if (primaryTargetDestination instanceof Error) {
          return primaryTargetDestination;
        }

        const faceDown = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
        primaryTargetDestination.rotation = faceDown;

        return {
          ...primaryTargetDestination,
          translationSpeedCurveOption: CurveType.EaseOut,
          translationPathCurveOption: CurveType.GradualToPeakThenSharpDrop,
        };
      },

      getNewParent: () => null,
      getAnimation: (user, animationLengths) =>
        getSpeciesTimedAnimation(user, animationLengths, SkeletalAnimationName.Enclose, false),
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

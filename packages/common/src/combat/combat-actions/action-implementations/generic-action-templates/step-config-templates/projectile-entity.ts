import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { CleanupMode } from "../../../../../types.js";
import { throwIfError } from "../../../../../utils/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import { getPrimaryTargetPositionAsDestination } from "../../common-destination-getters.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PreActionEntityMotionCheckEnvironmentalHazardTriggers]: {},
    [ActionResolutionStepType.OnActivationActionEntityMotion]: {
      getDestination: getPrimaryTargetPositionAsDestination,
      getNewParent: () => null,
      getEntityToLockOnTo: () => null,
      getStartPointingToward: (context) => {
        const { actionUserContext } = context;
        const { party } = actionUserContext;
        const targetingCalculator = new TargetingCalculator(actionUserContext, null);
        const primaryTarget = targetingCalculator.getPrimaryTargetCombatant(
          party,
          context.tracker.actionExecutionIntent
        );
        if (primaryTarget instanceof Error) throw primaryTarget;

        const startPointingToward: SceneEntityChildTransformNodeIdentifierWithDuration = {
          identifier: {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: primaryTarget.entityProperties.id,
            },
            transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
          },
          duration: 400,
        };

        return startPointingToward;
      },
      getCosmeticDestinationY: (context) => {
        const { actionUserContext, tracker } = context;
        const { actionExecutionIntent } = tracker;

        const targetingCalculator = new TargetingCalculator(actionUserContext, null);
        const primaryTargetId = throwIfError(
          targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent)
        );

        const entityPart: CombatantBaseChildTransformNodeIdentifier = {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: primaryTargetId,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        };
        return entityPart;
      },
    },
    [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
    [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
  },
  {
    // [ActionResolutionStepType.ActionEntityDissipationMotion]: {
    //   getDespawnOnCompleteCleanupModeOption: () => CleanupMode.Soft,
    // },
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self) => {
      return self.finalSteps;
    },
  }
);

export const PROJECTILE_ENTITY_STEPS_CONFIG = config;

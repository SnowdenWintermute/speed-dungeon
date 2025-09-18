import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
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
      getDespawnOnCompleteCleanupModeOption: () => CleanupMode.Soft,

      getNewParent: () => null,
      getEntityToLockOnTo: () => null,
      getCosmeticDestinationY: (context) => {
        const { combatantContext, tracker } = context;
        const { actionExecutionIntent } = tracker;

        const targetingCalculator = new TargetingCalculator(combatantContext, null);
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
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
  },
  {
    getFinalSteps: (self) => {
      return self.finalSteps;
    },
  }
);

export const PROJECTILE_ENTITY_STEPS_CONFIG = config;

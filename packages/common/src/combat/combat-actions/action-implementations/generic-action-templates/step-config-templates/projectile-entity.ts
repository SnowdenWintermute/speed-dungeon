import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import {
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import { getPrimaryTargetPositionAsDestination } from "../../common-destination-getters.js";

const config = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.OnActivationActionEntityMotion]: {
      getDestination: getPrimaryTargetPositionAsDestination,
      shouldDespawnOnComplete: () => true,

      getNewParent: () => null,
      getEntityToLockOnTo: () => null,
      getCosmeticDestinationY: (context) => {
        const { combatantContext, tracker } = context;
        const { actionExecutionIntent } = tracker;

        const targetingCalculator = new TargetingCalculator(combatantContext, null);
        const primaryTargetId =
          targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);

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

import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { CleanupMode } from "../../../../types.js";
import { throwIfError } from "../../../../utils/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatActionName } from "../../combat-action-names.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import { COMBAT_ACTIONS } from "../index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

const millisecondsDurationForInitialSplitArrowsToFaceTarget = 200;

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getStartPointingToward: (context) => {
    const { actionUserContext, tracker } = context;

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    const primaryTargetId = throwIfError(
      targetingCalculator.getPrimaryTargetCombatantId(tracker.actionExecutionIntent)
    );

    const targetModelHitboxIdentifier: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: primaryTargetId,
      },
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };

    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();

    const wasSpawnedByAnotherArrow =
      previousTrackerOption?.actionExecutionIntent.actionName ===
      CombatActionName.ChainingSplitArrowProjectile;

    let durationToPoint = millisecondsDurationForInitialSplitArrowsToFaceTarget;
    if (wasSpawnedByAnotherArrow) durationToPoint = 0;

    return { identifier: targetModelHitboxIdentifier, duration: durationToPoint };
  },
  getCosmeticDestinationY: (context) => {
    const { tracker } = context;
    const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);

    const primaryTargetId = throwIfError(
      targetingCalculator.getPrimaryTargetCombatantId(tracker.actionExecutionIntent)
    );

    const toReturn: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: primaryTargetId,
      },
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };

    return toReturn;
  },
  getDestination: (context) => {
    const { actionUserContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const targetingCalculator = new TargetingCalculator(actionUserContext, null);

    action.targetingProperties.getAutoTarget(
      actionUserContext,
      context.tracker.getPreviousTrackerInSequenceOption()
    );

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      actionUserContext.party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult;

    return { position: target.combatantProperties.homeLocation.clone() };
  },
  getNewParent: () => null,
};

const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

finalStepOverrides[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  getDespawnOnCompleteCleanupModeOption: (context) => {
    console.log("CHECK TO DESPAWN CHAINING_SPLIT_ARROW_PROJECTILE");
    const action = COMBAT_ACTIONS[CombatActionName.ChainingSplitArrowProjectile];
    const children = action.hierarchyProperties.getChildren(context, action);
    if (children.length === 0) {
      console.log("no child actions, despawn ChainingSplitArrowProjectile");
      return CleanupMode.Soft;
    }

    const { actionUserContext, tracker } = context;
    const { actionExecutionIntent } = tracker;

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);

    const { party } = actionUserContext;
    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );

    const combatantNotFound = primaryTargetResult instanceof Error;
    if (combatantNotFound) {
      console.log("combatant not found, despawn ChainingSplitArrowProjectile");
      return CleanupMode.Soft;
    }
    const targetIsDead = CombatantProperties.isDead(primaryTargetResult.combatantProperties);
    if (targetIsDead) {
      console.log("target is dead, despawn ChainingSplitArrowProjectile");
      return CleanupMode.Soft;
    }

    console.log("not despawning ChainingSplitArrowProjectile");

    return null;
  },
};

stepOverrides[ActionResolutionStepType.DetermineChildActions] = {};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY;
const config = createStepsConfig(base, {
  steps: stepOverrides,
  finalSteps: finalStepOverrides,
});

export const CHAINING_SPLIT_ARROW_PROJECTILE_STEPS_CONFIG = config;

import { ActionEntityName, ActionEntityProperties } from "../../../../action-entities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  CombatantBaseChildTransformNodeName,
  CombatantHoldableChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
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

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { combatantContext, tracker } = context;
    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();
    let position = combatantContext.combatant.combatantProperties.position.clone();

    let parentOption: undefined | SceneEntityChildTransformNodeIdentifier;

    const targetingCalculator = new TargetingCalculator(combatantContext, null);
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

    const initialPointToward: SceneEntityChildTransformNodeIdentifier = targetModelHitboxIdentifier;

    const initialLockRotationToFace: SceneEntityChildTransformNodeIdentifierWithDuration = {
      identifier: targetModelHitboxIdentifier,
      duration: 1,
    };

    let initialCosmeticYPosition: undefined | SceneEntityChildTransformNodeIdentifier;

    if (
      previousTrackerOption &&
      previousTrackerOption.actionExecutionIntent.actionName ===
        CombatActionName.ChainingSplitArrowProjectile &&
      previousTrackerOption.spawnedEntityOption &&
      previousTrackerOption.spawnedEntityOption.type === SpawnableEntityType.ActionEntity
    ) {
      // was spawned by previous arrow action in chain
      //
      const targetingCalculator = new TargetingCalculator(
        previousTrackerOption.parentActionManager.combatantContext,
        null
      );
      const previousActionTargetId = throwIfError(
        targetingCalculator.getPrimaryTargetCombatantId(previousTrackerOption.actionExecutionIntent)
      );

      position =
        previousTrackerOption.spawnedEntityOption.actionEntity.actionEntityProperties.position.clone();

      initialCosmeticYPosition = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: previousActionTargetId,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      };
    } else {
      // was spawned by initial parent action
      parentOption = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterEquipmentModel,
          characterModelId: combatantContext.combatant.entityProperties.id,
          slot: HoldableSlotType.MainHand,
        },
        transformNodeName: CombatantHoldableChildTransformNodeName.NockBone,
      };
    }

    const actionEntityProperties: ActionEntityProperties = {
      position,
      name: ActionEntityName.Arrow,
      initialPointToward,
      initialLockRotationToFace,
    };

    if (parentOption) actionEntityProperties.parentOption = parentOption;

    if (initialCosmeticYPosition)
      actionEntityProperties.initialCosmeticYPosition = initialCosmeticYPosition;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties,
      },
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getCosmeticDestinationY: (context) => {
    const { tracker } = context;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

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
    const { combatantContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const targetingCalculator = new TargetingCalculator(combatantContext, null);

    action.targetingProperties.getAutoTarget(
      combatantContext,
      context.tracker.getPreviousTrackerInSequenceOption()
    );

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      combatantContext.party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult;

    return { position: target.combatantProperties.homeLocation.clone() };
  },
  getNewParent: () => null,
  shouldDespawnOnComplete: () => true,
};

stepOverrides[ActionResolutionStepType.DetermineChildActions] = {};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY;
export const CHAINING_SPLIT_ARROW_PROJECTILE_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepOverrides,
});

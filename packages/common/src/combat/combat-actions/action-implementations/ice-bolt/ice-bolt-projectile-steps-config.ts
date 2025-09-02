import { Vector3 } from "@babylonjs/core";
import { ActionEntityName, CosmeticEffectNames } from "../../../../action-entities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import {
  ActionEntityBaseChildTransformNodeName,
  CombatantBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party, combatant } = combatantContext;
    const position = combatantContext.combatant.combatantProperties.position.clone();

    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.IceBolt,
          initialRotation: new Vector3(Math.PI / 2, 0, 0),
          parentOption: {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: combatant.entityProperties.id,
            },
            transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
          },
          pointTowardEntityOption: target.entityProperties.id,
        },
      },
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getDestination: getPrimaryTargetPositionAsDestination,
  getNewParent: () => null,
  getStartPointingToward: (context) => {
    const { combatantContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    // @PERF - can probably combine all these individual targetingCalculator creations
    // and pass the targetId to getStartPointingTowardEntityOption and getCosmeticDestinationY et al
    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const primaryTargetId = targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
    return {
      identifier: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: primaryTargetId,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      },
      duration: 400,
    };
  },
  getCosmeticDestinationY: (context) => {
    const { combatantContext, tracker } = context;
    const { actionExecutionIntent } = tracker;

    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const primaryTargetId = targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);

    const entityPart: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: primaryTargetId,
      },
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };
    return entityPart;
  },
  getCosmeticsEffectsToStart: (context) => {
    const iceBoltProjectile = context.tracker.getExpectedSpawnedActionEntity();
    return [
      {
        name: CosmeticEffectNames.FrostParticleStream,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: iceBoltProjectile.actionEntity.entityProperties.id,
          },
          transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
        },
      },
    ];
  },
  shouldDespawnOnComplete: () => true,
};

stepOverrides[ActionResolutionStepType.RollIncomingHitOutcomes] = {
  getCosmeticsEffectsToStart: (context) => {
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
    const targetId = targetingCalculator.getPrimaryTargetCombatantId(
      context.tracker.actionExecutionIntent
    );

    return [
      {
        name: CosmeticEffectNames.FrostParticleBurst,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: targetId,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        },
        lifetime: 300,
      },
    ];
  },
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY;
export const ICE_BOLT_PROJECTILE_STEPS_CONFIG = createStepsConfig(base, { steps: stepOverrides });

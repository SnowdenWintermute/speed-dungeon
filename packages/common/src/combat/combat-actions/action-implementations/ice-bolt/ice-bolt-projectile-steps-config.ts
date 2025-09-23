import { Vector3 } from "@babylonjs/core";
import {
  ActionEntity,
  ActionEntityName,
  CosmeticEffectNames,
} from "../../../../action-entities/index.js";
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
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { nameToPossessive, throwIfError } from "../../../../utils/index.js";
import { CleanupMode } from "../../../../types.js";
import { createCopyOfProjectileUser } from "../../../../combatants/index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntity: (context) => {
    const { actionUserContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party, actionUser } = actionUserContext;
    const position = actionUser.getPosition().clone();

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    const firedByCombatantName = actionUser.getName();

    const actionEntity = new ActionEntity(
      {
        id: context.idGenerator.generate(),
        name: `${nameToPossessive(firedByCombatantName)} ice bolt`,
      },
      {
        position,
        name: ActionEntityName.IceBolt,
        initialRotation: new Vector3(Math.PI / 2, 0, 0),
        parentOption: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: actionUser.getEntityId(),
          },
          transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
        },
        initialPointToward: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: target.entityProperties.id,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
        },
      }
    );

    // @REFACTOR - action entity as IActionUser
    const expectedProjectile = actionEntity;
    // without this cloning we'll be modifying the actual user when incinerating projectiles
    // or adding resource change source categories to the .asShimmedActionEntity
    // or otherwise polluting our original user
    // @REFACTOR - put this cloning into the projectile template
    const projectileUser = createCopyOfProjectileUser(
      context.combatantContext.combatant,
      actionEntity
    );
    // replace the user here. unlike arrows which are spawned by the parent action
    // and only moved by the projectile action, we spawn and move the projectile
    // all in the same projectile action in spells, and we must modify the user
    // after the projectile has spawned
    context.combatantContext.combatant = projectileUser;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity,
    };
  },
};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getDestination: getPrimaryTargetPositionAsDestination,
  getNewParent: () => null,
  getStartPointingToward: (context) => {
    const { actionUserContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    // @PERF - can probably combine all these individual targetingCalculator creations
    // and pass the targetId to getStartPointingTowardEntityOption and getCosmeticDestinationY et al
    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    let primaryTargetId = throwIfError(
      targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent)
    );
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
    const { actionUserContext, tracker } = context;
    const { actionExecutionIntent } = tracker;

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    const primaryTargetId = throwIfError(
      targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent)
    );

    const entityPart: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: primaryTargetId,
      },
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };
    return entityPart;
  },
  getCosmeticEffectsToStart: (context) => {
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
  getDespawnOnCompleteCleanupModeOption: () => CleanupMode.Soft,
};

stepOverrides[ActionResolutionStepType.RollIncomingHitOutcomes] = {
  getCosmeticEffectsToStart: (context) => {
    if (context.tracker.projectileWasIncinerated) return [];

    const targetingCalculator = new TargetingCalculator(context.actionUserContext, null);
    const targetId = throwIfError(
      targetingCalculator.getPrimaryTargetCombatantId(context.tracker.actionExecutionIntent)
    );

    return [
      CosmeticEffectInstructionFactory.createParticlesOnTargetBody(
        CosmeticEffectNames.FrostParticleBurst,
        300,
        targetId
      ),
    ];
  },
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY;
export const ICE_BOLT_PROJECTILE_STEPS_CONFIG = createStepsConfig(base, { steps: stepOverrides });

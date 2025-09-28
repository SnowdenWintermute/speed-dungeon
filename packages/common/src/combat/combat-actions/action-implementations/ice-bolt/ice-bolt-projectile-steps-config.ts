import { CosmeticEffectNames } from "../../../../action-entities/index.js";
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
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { CosmeticEffectInstructionFactory } from "../generic-action-templates/cosmetic-effect-factories/index.js";
import { throwIfError } from "../../../../utils/index.js";
import { CleanupMode } from "../../../../types.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

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
    const iceBoltProjectile = context.actionUserContext.actionUser;
    return [
      {
        name: CosmeticEffectNames.FrostParticleStream,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: iceBoltProjectile.getEntityId(),
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
    if (context.actionUserContext.actionUser.wasRemovedBeforeHitOutcomes()) return [];

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

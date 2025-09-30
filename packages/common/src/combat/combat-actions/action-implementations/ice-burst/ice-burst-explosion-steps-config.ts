import { CosmeticEffectNames } from "../../../../action-entities/index.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, DynamicAnimationName } from "../../../../app-consts.js";
import {
  ActionEntityBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { CleanupMode } from "../../../../types.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDelivery },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
      // timing: { type: AnimationTimingType.Timed, duration: 1000 },
    };
  },
  getCosmeticEffectsToStart: (context) => {
    const iceBurstEntity = context.actionUserContext.actionUser;
    return [
      {
        name: CosmeticEffectNames.FrostParticleBurst,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.ActionEntityModel,
            entityId: iceBurstEntity.getEntityId(),
          },
          transformNodeName: ActionEntityBaseChildTransformNodeName.EntityRoot,
        },
        lifetime: 300,
      },
    ];
  },
};

const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

finalStepOverrides[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.IceBurstDissipation },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      // timing: { type: AnimationTimingType.Timed, duration: 1000 },
      smoothTransition: false,
    };
  },
  getDespawnOnCompleteCleanupModeOption: () => CleanupMode.Soft,
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_ENTITY;
export const ICE_BURST_EXPLOSION_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepOverrides,
  finalSteps: finalStepOverrides,
});

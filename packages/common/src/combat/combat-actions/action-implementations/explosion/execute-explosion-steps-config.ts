import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, DynamicAnimationName } from "../../../../app-consts.js";
import { CleanupMode } from "../../../../types.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepsOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepsOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
      // timing: { type: AnimationTimingType.Timed, duration: 1200 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
};

const finalStepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> =
  {};

finalStepOverrides[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
      // timing: { type: AnimationTimingType.Timed, duration: 700 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
  getDespawnOnCompleteCleanupModeOption: () => CleanupMode.Soft,
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_ENTITY;
export const EXECUTE_EXPLOSION_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepsOverrides,
  finalSteps: finalStepOverrides,
});

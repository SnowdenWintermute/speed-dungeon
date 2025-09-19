import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepOverrides: Partial<
  Record<ActionResolutionStepType, Partial<ActionResolutionStepConfig>>
> = {};
stepOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  // will be set by environmental hazard checking step
  getDelay: (externallySetDelayOption) => {
    return externallySetDelayOption || 0;
  },
};

const stepsConfig = createStepsConfig(ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.MODIFY_ACTION_ENTITY, {
  steps: stepOverrides,
});

export const INCINERATE_PROJECTILE_STEPS_CONFIG = stepsConfig;

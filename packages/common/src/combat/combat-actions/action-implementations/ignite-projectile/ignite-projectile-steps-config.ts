import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepOverrides: Partial<
  Record<ActionResolutionStepType, Partial<ActionResolutionStepConfig>>
> = {};

export const IGNITE_PROJECTILE_STEPS_CONFIG = createStepsConfig(
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.VALUE_CHANGE_TICK,
  {
    steps: stepOverrides,
  }
);

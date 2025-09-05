import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import { createStepsConfig } from "../generic-action-templates/step-config-templates/index.js";
import { BURNING_TICK_STEPS_CONFIG } from "../burning-tick/burning-tick-steps-config.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.ChamberingMotion] = {
  getDelay: () => 2000,
};

const base = cloneDeep(BURNING_TICK_STEPS_CONFIG);

const stepsConfig = createStepsConfig(() => base, {
  steps: stepOverrides,
});

export const FIREWALL_BURN_STEPS_CONFIG = stepsConfig;

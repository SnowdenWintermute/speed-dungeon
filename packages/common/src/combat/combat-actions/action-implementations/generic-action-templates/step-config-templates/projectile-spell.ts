import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import {
  ActionResolutionStepConfig,
  ActionResolutionStepsConfig,
} from "../../../combat-action-steps-config.js";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";

const config = cloneDeep(BASIC_SPELL_STEPS_CONFIG);
delete config.steps[ActionResolutionStepType.RollIncomingHitOutcomes];

const recoveryMotionStepConfig: ActionResolutionStepConfig = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
};

const stepsConfig = {
  ...config.steps,
  [ActionResolutionStepType.StartConcurrentSubActions]: {},
};

const finalStepsConfig = {
  ...config.finalSteps,
  [ActionResolutionStepType.RecoveryMotion]: recoveryMotionStepConfig,
};

export const PROJECTILE_SPELL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  stepsConfig,
  finalStepsConfig,
  config.options
);

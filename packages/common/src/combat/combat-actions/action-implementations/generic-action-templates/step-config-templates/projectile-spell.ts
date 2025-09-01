import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import {
  ActionResolutionStepConfig,
  ActionResolutionStepsConfig,
} from "../../../combat-action-steps-config.js";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";
import { PROJECTILE_SKILL_STEPS_CONFIG } from "./projectile-skill.js";

const config = cloneDeep(BASIC_SPELL_STEPS_CONFIG);
delete config.steps[ActionResolutionStepType.RollIncomingHitOutcomes];

const projectileSkillConfig = PROJECTILE_SKILL_STEPS_CONFIG;

const recoveryMotionStepConfig: ActionResolutionStepConfig = {
  ...config.steps[ActionResolutionStepType.RecoveryMotion],
  ...projectileSkillConfig.steps[ActionResolutionStepType.RecoveryMotion],
};

const stepsConfig = {
  ...config.steps,
  [ActionResolutionStepType.StartConcurrentSubActions]: {},
  [ActionResolutionStepType.RecoveryMotion]: recoveryMotionStepConfig,
};

export const PROJECTILE_SPELL_STEPS_CONFIG = new ActionResolutionStepsConfig(stepsConfig, {
  userShouldMoveHomeOnComplete: true,
});

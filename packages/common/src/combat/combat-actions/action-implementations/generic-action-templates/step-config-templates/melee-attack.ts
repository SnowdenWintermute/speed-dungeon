import cloneDeep from "lodash.clonedeep";
import { MELEE_SKILL_STEPS_CONFIG } from "./melee-skill.js";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";

const config = cloneDeep(MELEE_SKILL_STEPS_CONFIG);
config.steps[ActionResolutionStepType.DetermineMeleeActionAnimations] = {};
config.steps[ActionResolutionStepType.RollIncomingHitOutcomes] = {};
config.steps[ActionResolutionStepType.EvalOnHitOutcomeTriggers] = {};

config.steps[ActionResolutionStepType.DetermineChildActions] = {};

export const MELEE_ATTACK_STEPS_CONFIG = config;

import cloneDeep from "lodash.clonedeep";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";
import { PROJECTILE_SPELL_STEPS_CONFIG } from "./projectile-spell.js";
import { BOW_SKILL_STEPS_CONFIG } from "./bow-skill.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";
import { PROJECTILE_SKILL_STEPS_CONFIG } from "./projectile-skill.js";
import { CONSUMABLE_USE_BASE_STEPS_CONFIG } from "./consumable-use.js";
import { MELEE_SKILL_STEPS_CONFIG } from "./melee-skill.js";
import { MAIN_HAND_MELEE_ATTACK_STEPS_CONFIG } from "./main-hand-melee-attack.js";
import { OFF_HAND_MELEE_ATTACK_STEPS_CONFIG } from "./off-hand-melee-attack.js";
import { EXPLOSION_ENTITY_STEPS_CONFIG } from "./explosion-entity.js";
import { PROJECTILE_ENTITY_STEPS_CONFIG } from "./projectile-entity.js";
import {
  ActionResolutionStepConfig,
  ActionResolutionStepsConfig,
  ActionResolutionStepsConfigOptions,
} from "../../../combat-action-steps-config.js";
import { ActionResolutionStepType } from "../../../../../action-processing/action-steps/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../../../utils/index.js";

export const ACTION_STEPS_CONFIG_TEMPLATE_GETTERS = {
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_STEPS_CONFIG),
  RANGED_SKILL: () => cloneDeep(RANGED_SKILL_STEPS_CONFIG),
  PROJECTILE_SKILL: () => cloneDeep(PROJECTILE_SKILL_STEPS_CONFIG),
  PROJECTILE_SPELL: () => cloneDeep(PROJECTILE_SPELL_STEPS_CONFIG),
  BOW_SKILL: () => cloneDeep(BOW_SKILL_STEPS_CONFIG),
  CONSUMABLE_USE: () => cloneDeep(CONSUMABLE_USE_BASE_STEPS_CONFIG),
  MELEE_SKILL: () => cloneDeep(MELEE_SKILL_STEPS_CONFIG),
  MAIN_HAND_MELEE_ATTACK: () => cloneDeep(MAIN_HAND_MELEE_ATTACK_STEPS_CONFIG),
  OFF_HAND_MELEE_ATTACK: () => cloneDeep(OFF_HAND_MELEE_ATTACK_STEPS_CONFIG),
  EXPLOSION_ENTITY: () => cloneDeep(EXPLOSION_ENTITY_STEPS_CONFIG),
  PROJECTILE_ENTITY: () => cloneDeep(PROJECTILE_ENTITY_STEPS_CONFIG),
};

export function createStepsConfig(
  templateGetter: () => ActionResolutionStepsConfig,
  overrides: {
    steps: Partial<Record<ActionResolutionStepType, Partial<ActionResolutionStepConfig>>>;
    options?: ActionResolutionStepsConfigOptions;
  }
): ActionResolutionStepsConfig {
  const base = templateGetter();

  for (const [stepType, stepOverrides] of iterateNumericEnumKeyedRecord(overrides.steps)) {
    base.steps[stepType] = {
      ...base.steps[stepType],
      ...stepOverrides,
    };
  }

  if (overrides.options)
    base.options = {
      ...base.options,
      ...overrides.options,
    };

  return base;
}

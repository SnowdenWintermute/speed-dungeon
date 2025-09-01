import cloneDeep from "lodash.clonedeep";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";
import { PROJECTILE_SPELL_STEPS_CONFIG } from "./projectile-spell.js";
import { BOW_SKILL_STEPS_CONFIG } from "./bow-skill.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";
import { PROJECTILE_SKILL_STEPS_CONFIG } from "./projectile-skill.js";

export const ACTION_STEPS_CONFIG_TEMPLATE_GETTERS = {
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_STEPS_CONFIG),
  RANGED_SKILL: () => cloneDeep(RANGED_SKILL_STEPS_CONFIG),
  PROJECTILE_SKILL: () => cloneDeep(PROJECTILE_SKILL_STEPS_CONFIG),
  PROJECTILE_SPELL: () => cloneDeep(PROJECTILE_SPELL_STEPS_CONFIG),
  BOW_SKILL: () => cloneDeep(BOW_SKILL_STEPS_CONFIG),
};

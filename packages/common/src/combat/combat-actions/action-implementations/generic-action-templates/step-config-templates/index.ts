import cloneDeep from "lodash.clonedeep";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";
import { PROJECTILE_SPELL_STEPS_CONFIG } from "./projectile-spell.js";

export const ACTION_STEPS_CONFIG_TEMPLATE_GETTERS = {
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_STEPS_CONFIG),
  PROJECTILE_SPELL: () => cloneDeep(PROJECTILE_SPELL_STEPS_CONFIG),
};

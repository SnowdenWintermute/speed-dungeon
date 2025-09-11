import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./ice-bolt-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ICE_BOLT_PROJECTILE_STEPS_CONFIG } from "./ice-bolt-projectile-steps-config.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const config: CombatActionComponentConfig = {
  description: "An icy projectile",
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE(),
  hitOutcomeProperties: ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL(),
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
  }),
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ICE_BOLT_PARENT,
  },

  stepsConfig: ICE_BOLT_PROJECTILE_STEPS_CONFIG,
};

export const ICE_BOLT_PROJECTILE = new CombatActionComposite(
  CombatActionName.IceBoltProjectile,
  config
);

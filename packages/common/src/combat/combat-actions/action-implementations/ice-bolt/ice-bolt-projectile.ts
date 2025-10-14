import {
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES } from "./ice-bolt-projectile-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ICE_BOLT_PROJECTILE_STEPS_CONFIG } from "./ice-bolt-projectile-steps-config.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";

const targetingProperties = TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE();
targetingProperties.executionPreconditions = [
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
];

const config: CombatActionComponentConfig = {
  description: "An icy projectile",
  targetingProperties,
  hitOutcomeProperties: ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL(),
  gameLogMessageProperties: new CombatActionGameLogProperties({
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

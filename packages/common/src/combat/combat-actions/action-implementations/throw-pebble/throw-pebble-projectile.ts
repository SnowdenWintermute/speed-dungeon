import { CombatActionComponentConfig, CombatActionComposite } from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { THROW_PEBBLE_PARENT } from "./throw-pebble-parent.js";

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.PROJECTILE,
  {}
);

// if we don't execute if target is dead, the projectile entity never despawns since we get midway
// through firing
const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE,
  {
    executionPreconditions: [
      ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
    ],
  }
);

const stepsConfig = createStepsConfig(ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY, {
  steps: {},
});

export const THROW_PEBBLE_PROJECTILE_CONFIG: CombatActionComponentConfig = {
  description: "A pebble projectile",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties,
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => THROW_PEBBLE_PARENT,
  },
};

export const THROW_PEBBLE_PROJECTILE = new CombatActionComposite(
  CombatActionName.ThrowPebbleProjectile,
  THROW_PEBBLE_PROJECTILE_CONFIG
);

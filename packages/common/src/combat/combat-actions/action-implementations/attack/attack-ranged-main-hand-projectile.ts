import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
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

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.PROJECTILE,
  {}
);

// if we don't execute if target is dead, the arrow entity never despawns since we get midway
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

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG: CombatActionComponentConfig = {
  description: "An arrow",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties,
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ATTACK_RANGED_MAIN_HAND,
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG
);

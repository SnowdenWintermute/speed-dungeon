import {
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { EXECUTE_EXPLOSION_STEPS_CONFIG } from "./execute-explosion-steps-config.js";
import { EXECUTE_EXPLOSION_HIT_OUTCOME_PROPERTIES } from "./explosion-hit-outcome-properties.js";

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage in an area around the target",
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.EXPLOSION(),
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `Explosion detonates!`;
    },
  }),

  hitOutcomeProperties: EXECUTE_EXPLOSION_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: EXECUTE_EXPLOSION_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const EXECUTE_EXPLOSION = new CombatActionComposite(
  CombatActionName.ExecuteExplosion,
  config
);

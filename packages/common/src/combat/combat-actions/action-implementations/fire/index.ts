import { CombatActionComponentConfig, CombatActionLeaf } from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { FIRE_STEPS_CONFIG } from "./fire-steps-config.js";
import { FIRE_HIT_OUTCOME_PROPERTIES } from "./fire-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { TargetingScheme } from "../../targeting-schemes-and-categories.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";
import { createGenericSpellCastMessageProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  // ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_HOSTILE(), @ TODO - put this back
  ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_ANY(),
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costBases: {
    [ActionPayableResource.ActionPoints]: { base: 0, additives: { actionLevel: 1 } },
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies and cause them to start burning",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Fire),
  targetingProperties,
  hitOutcomeProperties: FIRE_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig: FIRE_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIRE = new CombatActionLeaf(CombatActionName.Fire, config);

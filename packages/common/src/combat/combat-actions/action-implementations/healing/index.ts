import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  TargetCategories,
  TargetingScheme,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { HEALING_HIT_OUTCOME_PROPERTIES } from "./healing-hit-outcome-properties.js";
import { HEALING_STEPS_CONFIG } from "./healing-steps-config.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_FRIENDLY(),
  getValidTargetCategories: () => TargetCategories.Any,
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Restore hit points or damage undead",
  gameLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Healing),
  targetingProperties,
  hitOutcomeProperties: HEALING_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig: HEALING_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const HEALING = new CombatActionLeaf(CombatActionName.Healing, config);

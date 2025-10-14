import {
  ActionPayableResource,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  TargetingScheme,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { BLIND_STEPS_CONFIG } from "./blind-steps-config.js";
import { BLIND_HIT_OUTCOME_PROPERTIES } from "./blind-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_HOSTILE(),
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costBases: { [ActionPayableResource.Mana]: { base: 1 } },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Reduce the accuracy of targets",
  prerequisiteAbilities: [],
  gameLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Blind),
  targetingProperties,
  hitOutcomeProperties: BLIND_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig: BLIND_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const BLIND = new CombatActionLeaf(CombatActionName.Blind, config);

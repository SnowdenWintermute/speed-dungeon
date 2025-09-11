import cloneDeep from "lodash.clonedeep";
import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  createGenericSpellCastMessageProperties,
  TargetCategories,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { FIREWALL_BURN_STEPS_CONFIG } from "./firewall-burn-steps-config.js";
import { BURNING_TICK_HIT_OUTCOME_PROPERTIES } from "../burning-tick/burning-tick-hit-outcome-properties.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_HOSTILE,
  { getValidTargetCategories: () => TargetCategories.Any }
);

const config: CombatActionComponentConfig = {
  description: "Entities burn when moving through a firewall",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.FirewallBurn),
    getOnUseMessage: (data) => `${data.nameOfActionUser} traverses the firewall`,
  }),

  hitOutcomeProperties: cloneDeep(BURNING_TICK_HIT_OUTCOME_PROPERTIES),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: FIREWALL_BURN_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIREWALL_BURN = new CombatActionComposite(CombatActionName.FirewallBurn, config);

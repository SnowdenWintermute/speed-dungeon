import { AbilityType } from "../../../../abilities/ability-types.js";
import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { FIREWALL_STEPS_CONFIG } from "./firewall-steps-config.js";

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage to any combatant that passes through the area",
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Fire }],
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_FRIENDLY(),
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.Firewall),
  }),

  hitOutcomeProperties: HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE(),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL(),
  stepsConfig: FIREWALL_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIREWALL = new CombatActionComposite(CombatActionName.Firewall, config);

import { CombatActionComponentConfig, CombatActionLeaf } from "../../index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { TargetingScheme } from "../../targeting-schemes-and-categories.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";
import {
  CombatActionGameLogProperties,
  createGenericSpellCastMessageProperties,
} from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { PROVOKE_HIT_OUTCOME_PROPERTIES } from "./provoke-hit-outcome-properties.js";
import { PROVOKE_STEPS_CONFIG } from "./provoke-steps-config.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE(),
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) return [TargetingScheme.Area];
    return toReturn;
  },
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costBases: { [ActionPayableResource.Mana]: { base: 1 } },
  getResourceCosts: (user, inCombat, selectedActionLevel, self) => {
    if (selectedActionLevel === 1) {
      return { [ActionPayableResource.Mana]: 1, [ActionPayableResource.ActionPoints]: 1 };
    } else if (selectedActionLevel === 2) {
      return { [ActionPayableResource.Mana]: 3, [ActionPayableResource.ActionPoints]: 2 };
    } else {
      return { [ActionPayableResource.Mana]: 5, [ActionPayableResource.ActionPoints]: 1 };
    }
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_SPELL;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const gameLogMessageProperties: CombatActionGameLogProperties =
  createGenericSpellCastMessageProperties(CombatActionName.Blind);

const config: CombatActionComponentConfig = {
  description: "Generate a high level of threat on targets",
  prerequisiteAbilities: [],
  gameLogMessageProperties,
  targetingProperties,
  hitOutcomeProperties: PROVOKE_HIT_OUTCOME_PROPERTIES,
  costProperties,
  stepsConfig: PROVOKE_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const PROVOKE = new CombatActionLeaf(CombatActionName.Provoke, config);

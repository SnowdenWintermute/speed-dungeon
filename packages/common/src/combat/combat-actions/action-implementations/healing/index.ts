import {
  ActionPayableResource,
  CombatActionComponentConfig,
  CombatActionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import {
  CombatActionTargetingPropertiesConfig,
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
  BASE_SPELL_MANA_COST_BASES,
} from "../../combat-action-cost-properties.js";
import { HEALING_HIT_OUTCOME_PROPERTIES } from "./healing-hit-outcome-properties.js";
import { HEALING_STEPS_CONFIG } from "./healing-steps-config.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
  getValidTargetCategories: () => TargetCategories.Any,
  usabilityContext: CombatActionUsabilityContext.All,
  intent: CombatActionIntent.Benevolent,
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Restore hit points or damage undead",
  combatLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Healing),
  targetingProperties,
  hitOutcomeProperties: HEALING_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      [ActionPayableResource.Mana]: BASE_SPELL_MANA_COST_BASES,
      [ActionPayableResource.ActionPoints]: {
        base: 1,
      },
    },
    requiresCombatTurnInThisContext: () => false,
    getEndsTurnOnUse: () => false,
  },
  stepsConfig: HEALING_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const HEALING = new CombatActionLeaf(CombatActionName.Healing, config);

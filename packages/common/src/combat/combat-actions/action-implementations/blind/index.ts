import {
  ActionPayableResource,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
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
} from "../../combat-action-cost-properties.js";
import { BLIND_STEPS_CONFIG } from "./blind-steps-config.js";
import { BLIND_HIT_OUTCOME_PROPERTIES } from "./blind-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
  getTargetingSchemes: (actionLevel) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Reduce the accuracy of targets",
  prerequisiteAbilities: [],
  combatLogMessageProperties: createGenericSpellCastMessageProperties(CombatActionName.Blind),
  targetingProperties,
  hitOutcomeProperties: BLIND_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      [ActionPayableResource.Mana]: {
        base: 1,
      },
      [ActionPayableResource.ActionPoints]: {
        base: 1,
      },
    },
    getEndsTurnOnUse: () => false,
    requiresCombatTurnInThisContext: (context) => {
      return false;
    },
  },
  stepsConfig: BLIND_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const BLIND = new CombatActionLeaf(CombatActionName.Blind, config);

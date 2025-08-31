import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  TargetCategories,
  TargetingScheme,
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
import { FIRE_STEPS_CONFIG } from "./fire-steps-config.js";
import { FIRE_HIT_OUTCOME_PROPERTIES } from "./fire-hit-outcome-properties.js";
import { getSpellCastCombatLogMessage } from "../combat-log-message-getters.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
  getValidTargetCategories: () => TargetCategories.Opponent,
  getTargetingSchemes: (actionLevel: number) => {
    const toReturn = [TargetingScheme.Single];
    if (actionLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies and cause them to start burning",
  origin: CombatActionOrigin.SpellCast,
  getOnUseMessage: (data) =>
    getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[CombatActionName.Fire]),
  targetingProperties,
  hitOutcomeProperties: FIRE_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      [ActionPayableResource.ActionPoints]: { base: 0, additives: { actionLevel: 1 } },
    },
    getCooldownTurns(user, selectedActionLevel) {
      return 1;
    },
  },
  stepsConfig: FIRE_STEPS_CONFIG,
  shouldExecute: () => true,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIRE = new CombatActionLeaf(CombatActionName.Fire, config);

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
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { BLIND_STEPS_CONFIG } from "./blind-steps-config.js";
import { BLIND_HIT_OUTCOME_PROPERTIES } from "./blind-hit-outcome-properties.js";
import { getSpellCastCombatLogMessage } from "../combat-log-message-getters.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
  validTargetCategories: TargetCategories.Opponent,
  getTargetingSchemes: (user) => {
    // return [TargetingScheme.Area];
    const toReturn = [TargetingScheme.Single];
    const spellLevel = user.combatantProperties.ownedActions[CombatActionName.Fire]?.level || 0;
    if (spellLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Reduce the accuracy of targets",
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getOnUseMessage: (data) =>
    getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[CombatActionName.Blind]),
  targetingProperties,
  hitOutcomeProperties: BLIND_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      [ActionPayableResource.Mana]: {
        base: 0,
      },
    },
  },
  stepsConfig: BLIND_STEPS_CONFIG,
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const BLIND = new CombatActionLeaf(CombatActionName.Blind, config);

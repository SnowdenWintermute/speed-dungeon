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
import { FIRE_STEPS_CONFIG } from "./fire-steps-config.js";
import { FIRE_HIT_OUTCOME_PROPERTIES } from "./fire-hit-outcome-properties.js";
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
  description: "Inflict magical fire damage on enemies and cause them to start burning",
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getOnUseMessage: (data) =>
    getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[CombatActionName.Fire]),
  targetingProperties,
  hitOutcomeProperties: FIRE_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      // [ActionPayableResource.Mana]: {
      //   base: 0,
      // },
    },
  },
  stepsConfig: FIRE_STEPS_CONFIG,
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const FIRE = new CombatActionLeaf(CombatActionName.Fire, config);

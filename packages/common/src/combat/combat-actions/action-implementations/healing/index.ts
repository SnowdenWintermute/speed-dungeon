import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponentConfig,
  CombatActionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  CombatActionUsabilityContext,
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
  BASE_SPELL_MANA_COST_BASES,
} from "../../combat-action-cost-properties.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { HEALING_HIT_OUTCOME_PROPERTIES } from "./healing-hit-outcome-properties.js";
import { HEALING_STEPS_CONFIG } from "./healing-steps-config.js";
import { getSpellCastCombatLogMessage } from "../combat-log-message-getters.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
  validTargetCategories: TargetCategories.Any,
  usabilityContext: CombatActionUsabilityContext.All,
  intent: CombatActionIntent.Benevolent,
  getTargetingSchemes: (user) => {
    const toReturn = [TargetingScheme.Single];
    const spellLevel = user.combatantProperties.ownedActions[CombatActionName.Healing]?.level || 0;
    if (spellLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Restore hit points to target(s)",
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getOnUseMessage: (data) =>
    getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[CombatActionName.Healing]),
  targetingProperties,
  hitOutcomeProperties: HEALING_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    costBases: {
      ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell].costBases,
      [ActionPayableResource.Mana]: {
        ...BASE_SPELL_MANA_COST_BASES,
        base: 0.25,
      },
    },
  },
  stepsConfig: HEALING_STEPS_CONFIG,
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const HEALING = new CombatActionLeaf(CombatActionName.Healing, config);

import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
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

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
  getTargetingSchemes: (user) => {
    const toReturn = [TargetingScheme.Single];
    const spellLevel = user.combatantProperties.ownedActions[CombatActionName.Fire]?.level || 0;
    if (spellLevel > 1) toReturn.push(TargetingScheme.Area);
    return toReturn;
  },
};

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies",
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties,
  hitOutcomeProperties: FIRE_HIT_OUTCOME_PROPERTIES,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
  stepsConfig: FIRE_STEPS_CONFIG,
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const FIRE = new CombatActionLeaf(CombatActionName.Fire, config);

import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../../combatants/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../../action-calculation-utils/standard-action-calculations.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";
import { BASIC_ATTACK_HIT_OUTCOME_PROPERTIES } from "./basic-attack.js";

export const RANGED_ACTION_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...BASIC_ATTACK_HIT_OUTCOME_PROPERTIES,
  accuracyModifier: 0.9,
  getUnmodifiedCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, null);
  },
  getArmorPenetration: function (user: CombatantProperties): number {
    return getStandardActionArmorPenetration(user, null);
  },
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
};

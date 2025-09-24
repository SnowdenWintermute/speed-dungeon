import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
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
  getUnmodifiedCritChance: function (user: IActionUser): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: IActionUser): number {
    return getStandardActionCritMultiplier(user, null);
  },
  getArmorPenetration: function (user: IActionUser): number {
    return getStandardActionArmorPenetration(user, null);
  },
  getCanTriggerCounterattack: (user: IActionUser) => false,
};

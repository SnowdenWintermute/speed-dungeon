import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatActionComponent } from "../../index.js";

export const MELEE_ATTACK_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Strength);
  },
  // could use self to get the armor pen attribute from the action, then can display the armor pen attribute on client
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Strength);
  },
};

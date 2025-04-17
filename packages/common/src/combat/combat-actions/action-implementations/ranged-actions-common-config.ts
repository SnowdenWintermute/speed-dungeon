import { CombatActionRequiredRange } from "../combat-action-range.js";
import { CombatantProperties } from "../../../combatants/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../action-calculation-utils/standard-action-calculations.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatActionComponent } from "../index.js";
import { ActionAccuracy, ActionAccuracyType } from "../combat-action-accuracy.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "./ranged-action-destination-getters.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getIsParryable: (user: CombatantProperties) => true,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => true,
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
    return getStandardActionCritMultiplier(user, CombatAttribute.Focus);
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Dexterity);
  },

  getManaChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties,
    self: CombatActionComponent
  ) => null,
  motionPhasePositionGetters: RANGED_ACTION_DESTINATION_GETTERS,
};

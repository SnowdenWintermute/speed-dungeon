import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../../action-calculation-utils/standard-action-calculations.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { getAttackResourceChangeProperties } from "../../attack/get-attack-hp-change-properties.js";
import { BASIC_ATTACK_HIT_OUTCOME_PROPERTIES } from "./basic-attack.js";

// @TODO
// apply conditions from weapon traits
// could make a "poison blade" item

export const MELEE_ATTACK_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...BASIC_ATTACK_HIT_OUTCOME_PROPERTIES,
  getUnmodifiedCritChance: function (user: IActionUser): number {
    return getStandardActionCritChance(user, CombatAttribute.Strength);
  },
  getCritMultiplier: function (user: IActionUser): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Strength);
  },
  getArmorPenetration: function (user: IActionUser): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Strength);
  },
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
      const hpChangeProperties = getAttackResourceChangeProperties(
        user,
        hitOutcomeProperties,
        actionLevel,
        primaryTarget,
        CombatAttribute.Strength
      );
      if (hpChangeProperties instanceof Error) return hpChangeProperties;
      return hpChangeProperties;
    },
  },
};

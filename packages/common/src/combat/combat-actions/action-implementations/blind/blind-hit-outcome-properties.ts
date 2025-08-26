import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { ThreatType } from "../../../../combatants/threat-manager/index.js";
import { STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER } from "../../../../combatants/threat-manager/threat-calculator.js";
import { CombatantConditionName } from "../../../../combatants/index.js";

export const BLIND_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
  flatThreatGeneratedOnHit: { [ThreatType.Stable]: 1, [ThreatType.Volatile]: 300 },
  flatThreatReducedOnMonsterVsPlayerHit: {
    [ThreatType.Stable]: STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER,
    [ThreatType.Volatile]: 0,
  },
  resourceChangePropertiesGetters: {},

  getCritChance: () => null,
  getCritMultiplier: () => null,
  getIsBlockable: () => false,

  getAppliedConditions: (user, actionLevel) => {
    return [
      {
        conditionName: CombatantConditionName.Blinded,
        level: actionLevel,
        stacks: 1,
        appliedBy: { entityProperties: user.entityProperties, friendOrFoe: FriendOrFoe.Hostile },
      },
    ];
  },
};

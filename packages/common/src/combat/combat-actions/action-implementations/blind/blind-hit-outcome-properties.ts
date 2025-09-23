import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { ThreatType } from "../../../../combatants/threat-manager/index.js";
import { STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER } from "../../../../combatants/threat-manager/threat-calculator.js";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const overrides: Partial<CombatActionHitOutcomeProperties> = {};
overrides.flatThreatGeneratedOnHit = { [ThreatType.Stable]: 1, [ThreatType.Volatile]: 300 };
overrides.flatThreatReducedOnMonsterVsPlayerHit = {
  [ThreatType.Stable]: STABLE_THREAT_REDUCTION_ON_MONSTER_DEBUFFING_PLAYER,
  [ThreatType.Volatile]: 0,
};
overrides.getUnmodifiedCritChance = () => null;
overrides.getCritMultiplier = () => null;
overrides.getIsBlockable = () => false;
overrides.getAppliedConditions = (user, actionLevel) => {
  return [
    {
      conditionName: CombatantConditionName.Blinded,
      level: actionLevel,
      stacks: 1,
      appliedBy: { entityProperties: user.getEntityProperties(), friendOrFoe: FriendOrFoe.Hostile },
    },
  ];
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
export const BLIND_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(base, overrides);

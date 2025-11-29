import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { ThreatType } from "../../../../combatants/threat-manager/index.js";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const overrides: Partial<CombatActionHitOutcomeProperties> = {};
overrides.flatThreatGeneratedOnHit = { [ThreatType.Stable]: 1, [ThreatType.Volatile]: 300 };

overrides.getUnmodifiedCritChance = () => null;
overrides.getCritMultiplier = () => null;
overrides.getIsBlockable = () => false;
overrides.getAppliedConditions = (user, actionRank) => {
  return [
    {
      conditionName: CombatantConditionName.FollowingPetCommand,
      level: actionRank,
      stacks: 1,
      appliedBy: {
        entityProperties: user.getEntityProperties(),
        friendOrFoe: FriendOrFoe.Friendly,
      },
    },
  ];
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;

export const PET_COMMAND_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(base, overrides);
